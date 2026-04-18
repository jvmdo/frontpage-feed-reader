import { db } from "@/db";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import { PAGINATION_LIMIT } from "@/lib/constants";
import { expect, test } from "./fixtures/test-extend";

test.describe("Infinite Scroll", () => {
  test("loads more items when scrolling down and ensures items are unique", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed a feed
    const [feed] = await db
      .insert(feeds)
      .values({
        url: `https://example.com/scrolling-feed?user=${userId}`,
        title: "Scrolling Feed",
      })
      .returning();

    // 2. Seed subscription
    await db.insert(subscriptions).values({
      userId,
      feedId: feed.id,
    });

    // 3. Seed enough items to ensure 3 pages
    // We use a fixed date and decrement it to ensure reverse-chronological order
    const totalItems = PAGINATION_LIMIT * 2 + 5;
    const now = Date.now();
    const items = Array.from({ length: totalItems }).map((_, i) => ({
      feedId: feed.id,
      guid: `item-${i}-${userId}`,
      title: `Infinite Scroll Article ${i}`,
      description: `Description for article ${i}`,
      publishedAt: new Date(now - i * 60000), // Each item is 1 minute older than the previous
    }));

    await db.insert(feedItems).values(items);

    // 4. Go to dashboard
    await page.goto("/dashboard");

    // Wait for initial hydration/loading to complete by checking for first article
    const firstArticle = page.getByRole("heading", {
      name: "Infinite Scroll Article 0",
    });
    await expect(firstArticle).toBeVisible();

    // 5. Verify first page items are present
    await expect(
      page.getByRole("heading", {
        name: `Infinite Scroll Article ${PAGINATION_LIMIT - 1}`,
      }),
    ).toBeVisible();

    // 6. Scroll to the bottom to trigger the next fetches
    // We scroll multiple times to ensure we trigger all pages
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
    }

    // 7. Verify all articles are loaded
    await expect(page.getByRole("article")).toHaveCount(totalItems);

    // 8. Verify specific items from each page
    await expect(
      page.getByRole("heading", {
        name: `Infinite Scroll Article ${PAGINATION_LIMIT}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: `Infinite Scroll Article ${PAGINATION_LIMIT * 2}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: `Infinite Scroll Article ${totalItems - 1}`,
      }),
    ).toBeVisible();

    // 9. Verify uniqueness: ensure Article 0 only appears once
    const article0Count = await page
      .getByRole("heading", { name: "Infinite Scroll Article 0" })
      .count();
    expect(article0Count).toBe(1);
  });
});
