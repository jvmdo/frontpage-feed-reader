import { subMinutes } from "date-fns";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { getUserFeedItems } from "./get-user-feed-items";

describe("getUserFeedItems", () => {
  test("returns empty array when user has no subscriptions", async ({
    tx,
    testUser,
  }) => {
    const result = await getUserFeedItems(tx, testUser.id);
    expect(result).toEqual([]);
  });

  test("returns items from subscribed feeds sorted by publishedAt DESC", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed and subscription
    const [feed] = await tx
      .insert(feeds)
      .values({
        url: "https://example.com/rss",
        title: "Example Feed",
      })
      .returning();

    await tx.insert(subscriptions).values({
      userId: testUser.id,
      feedId: feed.id,
    });

    // 2. Create feed items with different publication dates
    const now = new Date();
    const tenMinutesAgo = subMinutes(now, 10);
    const twentyMinutesAgo = subMinutes(now, 20);

    await tx.insert(feedItems).values([
      {
        feedId: feed.id,
        guid: "item1",
        title: "Item 1",
        publishedAt: tenMinutesAgo,
      },
      {
        feedId: feed.id,
        guid: "item2",
        title: "Item 2",
        publishedAt: now,
      },
      {
        feedId: feed.id,
        guid: "item3",
        title: "Item 3",
        publishedAt: twentyMinutesAgo,
      },
    ]);

    const result = await getUserFeedItems(tx, testUser.id);

    expect(result).toHaveLength(3);
    // Should be sorted DESC: now, 10m ago, 20m ago
    expect(result[0].item.title).toBe("Item 2");
    expect(result[1].item.title).toBe("Item 1");
    expect(result[2].item.title).toBe("Item 3");

    // Verify source join
    expect(result[0].feed.title).toBe("Example Feed");
  });

  test("only returns items for feeds the user is subscribed to", async ({
    tx,
    testUser,
  }) => {
    // 1. Create two feeds
    const [feed1] = await tx
      .insert(feeds)
      .values({
        url: "https://feed1.com/rss",
        title: "Feed 1",
      })
      .returning();

    const [feed2] = await tx
      .insert(feeds)
      .values({
        url: "https://feed2.com/rss",
        title: "Feed 2",
      })
      .returning();

    // 2. Subscribe user to ONLY feed1
    await tx.insert(subscriptions).values({
      userId: testUser.id,
      feedId: feed1.id,
    });

    // 3. Add items to both
    await tx.insert(feedItems).values([
      {
        feedId: feed1.id,
        guid: "f1-i1",
        title: "Feed 1 Item",
        publishedAt: new Date(),
      },
      {
        feedId: feed2.id,
        guid: "f2-i1",
        title: "Feed 2 Item",
        publishedAt: new Date(),
      },
    ]);

    const result = await getUserFeedItems(tx, testUser.id);

    expect(result).toHaveLength(1);
    expect(result[0].item.title).toBe("Feed 1 Item");
  });

  test("respects limit and offset", async ({ tx, testUser }) => {
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://example.com/rss" })
      .returning();

    await tx.insert(subscriptions).values({
      userId: testUser.id,
      feedId: feed.id,
    });

    // Create 5 items
    const items = Array.from({ length: 5 }).map((_, i) => ({
      feedId: feed.id,
      guid: `guid-${i}`,
      title: `Item ${i}`,
      publishedAt: subMinutes(new Date(), i),
    }));

    await tx.insert(feedItems).values(items);

    // Test limit
    const limitResult = await getUserFeedItems(tx, testUser.id, { limit: 2 });
    expect(limitResult).toHaveLength(2);
    expect(limitResult[0].item.title).toBe("Item 0");
    expect(limitResult[1].item.title).toBe("Item 1");

    // Test offset
    const offsetResult = await getUserFeedItems(tx, testUser.id, {
      limit: 2,
      offset: 2,
    });
    expect(offsetResult).toHaveLength(2);
    expect(offsetResult[0].item.title).toBe("Item 2");
    expect(offsetResult[1].item.title).toBe("Item 3");
  });
});
