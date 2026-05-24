import { subMinutes } from "date-fns";
import { db } from "@/db";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("FeedToolbar Refresh", () => {
  test("clicking 'Refresh' for a specific feed triggers ingestion", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: Seed a feed that points to a local fixture
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

    const { feed } = await seedFeedWithSubscription(db, userId, {
      url: feedUrl,
      title: "Toolbar Refresh Test",
      healthStatus: "unknown",
    });

    // 1. Navigate to the Dashboard for this specific feed
    await page.goto(`/dashboard?feedId=${feed.id}`);

    // 2. Wait for hydration
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Verify toolbar shows the correct title
    await expect(
      page.getByRole("heading", { name: "Toolbar Refresh Test" }),
    ).toBeVisible();

    // 4. Trigger Refresh from the toolbar
    const toolbar = page.getByRole("toolbar", { name: "Feed toolbar" });
    const refreshButton = toolbar.getByRole("button", { name: /refresh/i });

    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // 5. Verify operation succeeded
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /feed refreshed/i,
    );
    await expect(refreshButton).not.toBeDisabled();
  });

  test("manual refresh actually ingests new items (bypassing throttling)", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: A feed pointing to a valid fixture but with NO items in DB yet
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;
    const { feed } = await seedFeedWithSubscription(db, userId, {
      url: feedUrl,
      title: "Data Refresh Test",
      // Set lastFetchedAt to 2 minutes ago to bypass the 60s throttle
      lastFetchedAt: subMinutes(new Date(), 2),
    });

    // 1. Navigate to the feed view (should be empty initially)
    await page.goto(`/dashboard?feedId=${feed.id}`);
    await page.waitForSelector('body[data-hydrated="true"]');

    await expect(page.getByText(/your feed is empty/i)).toBeVisible();

    // 2. Trigger Refresh
    const toolbar = page.getByRole("toolbar", { name: "Feed toolbar" });
    await toolbar.getByRole("button", { name: /refresh/i }).click();

    // 3. Verify items from rss-2.xml fixture are now visible
    // rss-2.xml contains "Making Complex CSS Shapes"
    await expect(page.getByText(/Making Complex CSS Shapes/i)).toBeVisible();
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /feed refreshed/i,
    );
  });

  test("clicking 'Refresh' in All Items triggers global ingestion", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: Seed two feeds
    const f1 = `http://localhost:3432/rss-2.xml?tenant=${userId}-1`;
    const f2 = `http://localhost:3432/atom-1.xml?tenant=${userId}-2`;

    await seedFeedWithSubscription(db, userId, { url: f1, title: "F1" });
    await seedFeedWithSubscription(db, userId, { url: f2, title: "F2" });

    // 1. Navigate to All Items
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Trigger Refresh
    const toolbar = page.getByRole("toolbar", { name: "Feed toolbar" });
    const refreshButton = toolbar.getByRole("button", { name: /refresh/i });
    await refreshButton.click();

    // 3. Verify toast message for global scope
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /all feeds refreshed/i,
    );
  });

  test("clicking 'Refresh' in Category view triggers category ingestion", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: One category with a feed
    const cat = await seedCategory(db, { userId, name: "Tech News" });
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}-cat`;

    await seedFeedWithSubscription(
      db,
      userId,
      { url: feedUrl, title: "Cat Feed" },
      { categoryId: cat.id },
    );

    // 1. Navigate to Category view
    await page.goto(`/dashboard?categoryId=${cat.id}`);
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Trigger Refresh
    const toolbar = page.getByRole("toolbar", { name: "Feed toolbar" });
    const refreshButton = toolbar.getByRole("button", { name: /refresh/i });
    await refreshButton.click();

    // 3. Verify toast message for category scope
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /category refreshed/i,
    );
  });
});
