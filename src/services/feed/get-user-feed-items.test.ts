import { subMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { categories, subscriptions } from "@/db/schema";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import {
  seedCategory,
  seedFeed,
  seedFeedItems,
  seedFeedWithSubscription,
  seedUserItemState,
  seedUserPreferences,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getUserFeedItems } from "./get-user-feed-items";

const options = {
  limit: PAGINATION_LIMIT,
  offset: PAGINATION_INITIAL_OFFSET,
  feedId: undefined,
};

describe("getUserFeedItems", () => {
  test("returns empty array when user has no subscriptions", async ({
    tx,
    testUser,
  }) => {
    const result = await getUserFeedItems(tx, testUser.id, options);
    expect(result).toEqual([]);
  });

  test("returns items from subscribed feeds sorted by publishedAt DESC", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed and subscription
    const { feed } = await seedFeedWithSubscription(tx, testUser.id, {
      title: "Example Feed",
    });

    // 2. Create feed items with different publication dates
    const now = new Date();
    const tenMinutesAgo = subMinutes(now, 10);
    const twentyMinutesAgo = subMinutes(now, 20);

    await seedFeedItems(tx, feed.id, [
      { title: "Item 1", publishedAt: tenMinutesAgo },
      { title: "Item 2", publishedAt: now },
      { title: "Item 3", publishedAt: twentyMinutesAgo },
    ]);

    const result = await getUserFeedItems(tx, testUser.id, options);

    expect(result).toHaveLength(3);
    // Should be sorted DESC: now, 10m ago, 20m ago
    expect(result[0].item.title).toBe("Item 2");
    expect(result[1].item.title).toBe("Item 1");
    expect(result[2].item.title).toBe("Item 3");

    // Verify source join
    expect(result[0].feed.title).toBe("Example Feed");
  });

  test("returns categoryName when feed belongs to a category", async ({
    tx,
    testUser,
  }) => {
    const cat = await seedCategory(tx, {
      userId: testUser.id,
      name: "Technology",
    });
    const { feed } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: cat.id },
    );

    await seedFeedItems(tx, feed.id, [{ title: "Tech News" }]);

    const result = await getUserFeedItems(tx, testUser.id, options);

    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe("Technology");
  });

  test("only returns items for feeds the user is subscribed to", async ({
    tx,
    testUser,
  }) => {
    // 1. Create two feeds
    const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id);

    const feed2 = await seedFeed(tx);

    // 2. Add items to both
    await seedFeedItems(tx, feed1.id, [{ title: "Feed 1 Item" }]);
    await seedFeedItems(tx, feed2.id, [{ title: "Unsubscribed Feed Item" }]);

    const result = await getUserFeedItems(tx, testUser.id, options);

    expect(result).toHaveLength(1);
    expect(result[0].item.title).toBe("Feed 1 Item");
  });

  test("respects limit and offset", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    // Create 5 items
    const items = Array.from({ length: 5 }).map((_, i) => ({
      title: `Item ${i}`,
      publishedAt: subMinutes(new Date(), i),
    }));

    await seedFeedItems(tx, feed.id, items);

    // Test limit
    const limitResult = await getUserFeedItems(tx, testUser.id, {
      ...options,
      limit: 2,
    });

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

  describe("filtering by feedId", () => {
    test("returns only items from the specified feedId", async ({
      tx,
      testUser,
    }) => {
      // 1. Create two feeds and subscribe to both
      const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id);
      const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id);

      // 2. Add items to both
      await seedFeedItems(tx, feed1.id, [{ title: "Feed 1 Item" }]);
      await seedFeedItems(tx, feed2.id, [{ title: "Feed 2 Item" }]);

      // 3. Request items only for feed1
      const result = await getUserFeedItems(tx, testUser.id, {
        ...options,
        feedId: feed1.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("Feed 1 Item");
      expect(result[0].feed.id).toBe(feed1.id);
    });

    test("returns items from all subscribed feeds when feedId is not provided", async ({
      tx,
      testUser,
    }) => {
      const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id);
      const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id);

      await seedFeedItems(tx, feed1.id, [{ title: "F1 Item" }]);
      await seedFeedItems(tx, feed2.id, [{ title: "F2 Item" }]);

      const result = await getUserFeedItems(tx, testUser.id, options);

      expect(result).toHaveLength(2);
    });
  });

  describe("filtering by categoryId", () => {
    test("returns only items from the specified categoryId", async ({
      tx,
      testUser,
    }) => {
      // 1. Create two categories
      const cat1 = await seedCategory(tx, {
        userId: testUser.id,
        name: "Cat 1",
      });
      const cat2 = await seedCategory(tx, {
        userId: testUser.id,
        name: "Cat 2",
      });

      // 2. Create two feeds, each in a different category
      const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id, {}, {
        categoryId: cat1.id,
      });
      const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id, {}, {
        categoryId: cat2.id,
      });

      // 3. Add items to both
      await seedFeedItems(tx, feed1.id, [{ title: "Cat 1 Item" }]);
      await seedFeedItems(tx, feed2.id, [{ title: "Cat 2 Item" }]);

      // 4. Request items only for cat1
      const result = await getUserFeedItems(tx, testUser.id, {
        ...options,
        categoryId: cat1.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("Cat 1 Item");
      expect(result[0].feed.id).toBe(feed1.id);
    });

    test("returns items from all subscribed feeds when categoryId is not provided", async ({
      tx,
      testUser,
    }) => {
      const cat1 = await seedCategory(tx, {
        userId: testUser.id,
        name: "Cat 1",
      });

      const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id, {}, {
        categoryId: cat1.id,
      });
      const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id);

      await seedFeedItems(tx, feed1.id, [{ title: "C1 Item" }]);
      await seedFeedItems(tx, feed2.id, [{ title: "Uncategorized Item" }]);

      const result = await getUserFeedItems(tx, testUser.id, options);

      expect(result).toHaveLength(2);
    });
  });

  describe("isRead calculation", () => {
    test("marks item as read if user has explicit read state", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item] = await seedFeedItems(tx, feed.id, [{ title: "Item 1" }]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item.id,
        readAt: new Date(),
      });

      const result = await getUserFeedItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });

    test("marks item as unread if no state or watermarks exist", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedFeedItems(tx, feed.id, [{ title: "Item 1" }]);

      const result = await getUserFeedItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(false);
    });

    test("marks item as read if published before global watermark", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);
      const fiveMinutesAgo = subMinutes(now, 5);

      await seedFeedItems(tx, feed.id, [
        { title: "Old Item", publishedAt: tenMinutesAgo },
        { title: "New Item", publishedAt: now },
      ]);

      await seedUserPreferences(tx, {
        userId: testUser.id,
        markedAllReadAt: fiveMinutesAgo,
      });

      const result = await getUserFeedItems(tx, testUser.id, options);
      expect(result.find((r) => r.item.title === "Old Item")?.isRead).toBe(true);
      expect(result.find((r) => r.item.title === "New Item")?.isRead).toBe(false);
    });

    test("marks item as read if published before category watermark", async ({
      tx,
      testUser,
    }) => {
      const cat = await seedCategory(tx, { userId: testUser.id, name: "Cat" });
      const { feed } = await seedFeedWithSubscription(
        tx,
        testUser.id,
        {},
        { categoryId: cat.id },
      );
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      await seedFeedItems(tx, feed.id, [{ title: "Item", publishedAt: tenMinutesAgo }]);

      await tx
        .update(categories)
        .set({ markedAllReadAt: now })
        .where(eq(categories.id, cat.id));

      const result = await getUserFeedItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });

    test("marks item as read if published before subscription watermark", async ({
      tx,
      testUser,
    }) => {
      const { feed, subscription } = await seedFeedWithSubscription(tx, testUser.id);
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      await seedFeedItems(tx, feed.id, [{ title: "Item", publishedAt: tenMinutesAgo }]);

      await tx
        .update(subscriptions)
        .set({ markedAllReadAt: now })
        .where(eq(subscriptions.id, subscription.id));

      const result = await getUserFeedItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });
  });
});
