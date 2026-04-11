import { db } from "@/db";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import { expect, test } from "./fixtures/test-extend";

test.describe("Feed Filtering", () => {
  test("loads filtered state directly from URL with prefetched data", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed two different feeds
    const [feed1] = await db
      .insert(feeds)
      .values({
        url: `https://feed1.com/rss?tenant=${userId}`,
        title: "First Tech Feed",
      })
      .returning();

    const [feed2] = await db
      .insert(feeds)
      .values({
        url: `https://feed2.com/rss?tenant=${userId}`,
        title: "Second Design Feed",
      })
      .returning();

    // 2. Seed Subscriptions
    await db.insert(subscriptions).values([
      { userId, feedId: feed1.id },
      { userId, feedId: feed2.id },
    ]);

    // 3. Seed Items for both
    await db.insert(feedItems).values([
      {
        feedId: feed1.id,
        guid: `item-f1-${userId}`,
        title: "Article from First Feed",
        publishedAt: new Date(),
      },
      {
        feedId: feed2.id,
        guid: `item-f2-${userId}`,
        title: "Article from Second Feed",
        publishedAt: new Date(),
      },
    ]);

    // 4. Navigate DIRECTLY to feed 1 filtered URL
    await page.goto(`/dashboard?feedId=${feed1.id}`);

    // 5. Verify immediate content (no loading flash)
    const firstFeedItem = page.getByRole("heading", { name: "Article from First Feed" });
    const skeleton = page.getByLabel("Loading feed items...");

    await expect(firstFeedItem).toBeVisible();
    await expect(skeleton).not.toBeVisible();

    // 6. Verify isolation
    const secondFeedItem = page.getByRole("heading", { name: "Article from Second Feed" });
    await expect(secondFeedItem).not.toBeVisible();

    // 7. Verify header title
    const headerTitle = page.getByRole("heading", { level: 1 });
    await expect(headerTitle).toHaveText("First Tech Feed");
  });

  test("full flow: click feed -> updates UI -> click All Items -> resets UI", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed data
    const [feedA] = await db
      .insert(feeds)
      .values({
        url: `https://feed-a.com/rss?tenant=${userId}`,
        title: "Feed A",
      })
      .returning();

    const [feedB] = await db
      .insert(feeds)
      .values({
        url: `https://feed-b.com/rss?tenant=${userId}`,
        title: "Feed B",
      })
      .returning();

    await db.insert(subscriptions).values([
      { userId, feedId: feedA.id },
      { userId, feedId: feedB.id },
    ]);

    await db.insert(feedItems).values([
      {
        feedId: feedA.id,
        guid: `item-a-${userId}`,
        title: "Item A",
        publishedAt: new Date(),
      },
      {
        feedId: feedB.id,
        guid: `item-b-${userId}`,
        title: "Item B",
        publishedAt: new Date(),
      },
    ]);

    // 2. Start at All Items
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("All Items");
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();

    // 3. Click Feed A in sidebar
    await page.getByRole("link", { name: "Feed A" }).click();

    // 4. Verify updates
    await expect(page).toHaveURL(new RegExp(`feedId=${feedA.id}`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Feed A");
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Item B" })).not.toBeVisible();

    // 5. Click All Items to reset
    await page.getByRole("link", { name: "All Items" }).click();

    // 6. Verify reset
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("All Items");
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();
  });
});
