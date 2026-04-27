import { db } from "@/db";
import { PAGINATION_LIMIT } from "@/lib/constants";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Infinite Scroll", () => {
  test("loads more items when scrolling down and ensures items are unique", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: Seed a feed and subscription
    const { feed } = await seedFeedWithSubscription(db, userId, {
      url: `https://example.com/scrolling-feed?tenant=${userId}`,
      title: "Scrolling Feed",
    });

    // Seed enough items to ensure 3 pages
    // We use a fixed date and decrement it to ensure reverse-chronological order
    const totalItems = PAGINATION_LIMIT * 2 + 5;
    const now = Date.now();
    const items = Array.from({ length: totalItems }).map((_, i) => ({
      guid: `item-${i}-${userId}`,
      title: `Infinite Scroll Article ${i}`,
      description: `Description for article ${i}`,
      publishedAt: new Date(now - i * 60000), // Each item is 1 minute older than the previous
    }));

    await seedFeedItems(db, feed.id, items);

    // 1. Go to dashboard
    await page.goto("/dashboard");

    // 2. Verify first page items are present
    const firstItem = page.getByRole("heading", {
      name: "Infinite Scroll Article 0",
    });
    await expect(firstItem).toBeVisible();

    // 3. Scroll to the last visible item to trigger more loading
    // We scroll several times since virtualization means not all items are in DOM
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const container = document.getElementById("feed-container");
        if (container) container.scrollBy(0, container.scrollHeight);
      });
      // Give Virtuoso/Query some time to fetch and render
      await page.waitForTimeout(500);
    }

    // 4. Verify that an item from a later page is now visible
    const laterItem = page.getByRole("heading", {
      name: `Infinite Scroll Article ${totalItems - 1}`,
    });
    await expect(laterItem).toBeVisible();

    // 5. Scroll back to top and verify Article 0 is there (and only once)
    await page.evaluate(() => {
      const container = document.getElementById("feed-container");
      if (container) container.scrollTo(0, 0);
    });

    await expect(firstItem).toBeVisible();
    await expect(firstItem).toHaveCount(1);
  });
});
