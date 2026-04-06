import { db } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { expect, test } from "./fixtures/test-extend";

test.describe("Manage Feeds", () => {
  test("displays a subscribed feed in the list", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a feed and subscription directly
    const [feed] = await db
      .insert(feeds)
      .values({
        url: `https://example.com/rss?tenant=${userId}`,
        title: "Test Feed Title",
        healthStatus: "healthy",
      })
      .returning();

    await db.insert(subscriptions).values({
      userId: userId,
      feedId: feed.id,
    });

    // 2. Navigate to Dashboard then to Manage Feeds via sidebar
    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("link", { name: /manage feeds/i }).click();

    // 3. Verify we are on the correct page and the feed is visible
    await expect(page).toHaveURL("/manage-feeds");
    await expect(
      page.getByRole("heading", { name: /manage feeds/i }),
    ).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByText("Test Feed Title")).toBeVisible();
    await expect(
      table.getByText(`https://example.com/rss?tenant=${userId}`),
    ).toBeVisible();
    await expect(table.getByText(/healthy/i)).toBeVisible();
  });

  test("shows empty state when no feeds are subscribed", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    // Navigate directly to Manage Feeds
    await page.goto("/manage-feeds");

    // Verify empty state
    await expect(page.getByText(/no feeds yet/i)).toBeVisible();
    await expect(
      page.getByText(/you haven't subscribed to any rss feeds/i),
    ).toBeVisible();
  });
});
