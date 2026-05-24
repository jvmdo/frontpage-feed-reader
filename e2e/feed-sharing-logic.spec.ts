import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { seedFeed, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Feed Sharing and First-Fetch Logic", () => {
  test("User A: sees items immediately when adding a brand new feed", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: no seeding at all
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

    // 1. Navigate
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Add the brand new feed
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.locator('[data-tour="add-feed"]').click();

    const dialog = page.getByRole("dialog", { name: /add feed/i });
    await dialog.getByLabel(/feed url/i).fill(feedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // 3. Verify items are visible immediately
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Feed added successfully",
    );

    await expect(
      page
        .getByRole("article")
        .getByText(/Making Complex CSS Shapes/i)
        .first(),
    ).toBeVisible();
  });

  test("User B: sees items immediately when adding an existing feed", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: A "Phantom User" has already added this feed to the global DB
    const sharedUrl = `http://localhost:3432/atom-1.xml?shared=${userId}`;

    // Ensure the feed and its items exist in the DB before User A joins
    const feed = await seedFeed(db, {
      url: sharedUrl,
      title: "Shared Atom Feed",
    });

    await seedItems(db, feed.id, [
      {
        guid: `shared-item-${userId}`,
        title: "Existing Shared Article",
        publishedAt: new Date(),
      },
    ]);

    // 1. Navigate
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. User A adds the SAME shared feed
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.locator('[data-tour="add-feed"]').click();

    const dialog = page.getByRole("dialog", { name: /add feed/i });
    await dialog.getByLabel(/feed url/i).fill(sharedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // 3. Verify success
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Feed added successfully",
    );

    // 4. Verify User A sees the articles that were already in the DB
    await expect(page.getByText("Existing Shared Article")).toBeVisible();

    // Cleanup shared feed (authedPage only cleans up tenant-specific feeds)
    await db.delete(feeds).where(eq(feeds.id, feed.id));
  });
});
