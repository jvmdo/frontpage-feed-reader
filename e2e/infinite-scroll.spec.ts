import { db } from "@/db";
import { feedItems, feeds, subscriptions } from "@/db/schema";
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

    // 3. Seed 45 items to ensure 3 pages (20 + 20 + 5)
    // We use a fixed date and decrement it to ensure reverse-chronological order
    const now = Date.now();
    const items = Array.from({ length: 45 }).map((_, i) => ({
      feedId: feed.id,
      guid: `item-${i}-${userId}`,
      title: `Infinite Scroll Article ${i}`,
      description: `Description for article ${i}`,
      publishedAt: new Date(now - i * 60000), // Each item is 1 minute older than the previous
    }));

    await db.insert(feedItems).values(items);

    // 4. Go to dashboard
    await page.goto("/dashboard");

    // 5. Verify first page items (0-19)
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 0" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 19" }),
    ).toBeVisible();
    
    // Article 20 should NOT be visible yet
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 20" }),
    ).not.toBeVisible();

    // 6. Scroll to the bottom to trigger the first fetch
    // We look for the scroll trigger or just scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 7. Verify second page items (20-39) are loaded
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 20" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 39" }),
    ).toBeVisible();
    
    // Article 40 should NOT be visible yet
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 40" }),
    ).not.toBeVisible();

    // 8. Scroll to the bottom again to trigger the second fetch
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 9. Verify third page items (40-44) are loaded
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 40" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Infinite Scroll Article 44" }),
    ).toBeVisible();

    // 10. Verify uniqueness: ensure Article 0 only appears once
    const article0Count = await page
      .getByRole("heading", { name: "Infinite Scroll Article 0" })
      .count();
    expect(article0Count).toBe(1);

    // Verify we have all 45 articles
    const allArticles = page.getByRole("article");
    await expect(allArticles).toHaveCount(45);
  });
});
