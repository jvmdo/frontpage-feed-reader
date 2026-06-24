import { subMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { categories, subscriptions } from "@/db/schema";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import {
  seedCategory,
  seedFeed,
  seedFeedWithSubscription,
  seedItems,
  seedUserItemState,
  seedUserPreferences,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getItems } from "./get-items";

const options = {
  limit: PAGINATION_LIMIT,
  offset: PAGINATION_INITIAL_OFFSET,
  feedId: undefined,
};

describe("getItems", () => {
  test("returns empty array when user has no subscriptions", async ({
    tx,
    testUser,
  }) => {
    const result = await getItems(tx, testUser.id, options);
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

    await seedItems(tx, feed.id, [
      { title: "Item 1", publishedAt: tenMinutesAgo },
      { title: "Item 2", publishedAt: now },
      { title: "Item 3", publishedAt: twentyMinutesAgo },
    ]);

    const result = await getItems(tx, testUser.id, options);

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

    await seedItems(tx, feed.id, [{ title: "Tech News" }]);

    const result = await getItems(tx, testUser.id, options);

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
    await seedItems(tx, feed1.id, [{ title: "Feed 1 Item" }]);
    await seedItems(tx, feed2.id, [{ title: "Unsubscribed Feed Item" }]);

    const result = await getItems(tx, testUser.id, options);

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

    await seedItems(tx, feed.id, items);

    // Test limit
    const limitResult = await getItems(tx, testUser.id, {
      ...options,
      limit: 2,
    });

    expect(limitResult).toHaveLength(2);
    expect(limitResult[0].item.title).toBe("Item 0");
    expect(limitResult[1].item.title).toBe("Item 1");

    // Test offset
    const offsetResult = await getItems(tx, testUser.id, {
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
      await seedItems(tx, feed1.id, [{ title: "Feed 1 Item" }]);
      await seedItems(tx, feed2.id, [{ title: "Feed 2 Item" }]);

      // 3. Request items only for feed1
      const result = await getItems(tx, testUser.id, {
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

      await seedItems(tx, feed1.id, [{ title: "F1 Item" }]);
      await seedItems(tx, feed2.id, [{ title: "F2 Item" }]);

      const result = await getItems(tx, testUser.id, options);

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
      const { feed: feed1 } = await seedFeedWithSubscription(
        tx,
        testUser.id,
        {},
        {
          categoryId: cat1.id,
        },
      );
      const { feed: feed2 } = await seedFeedWithSubscription(
        tx,
        testUser.id,
        {},
        {
          categoryId: cat2.id,
        },
      );

      // 3. Add items to both
      await seedItems(tx, feed1.id, [{ title: "Cat 1 Item" }]);
      await seedItems(tx, feed2.id, [{ title: "Cat 2 Item" }]);

      // 4. Request items only for cat1
      const result = await getItems(tx, testUser.id, {
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

      const { feed: feed1 } = await seedFeedWithSubscription(
        tx,
        testUser.id,
        {},
        {
          categoryId: cat1.id,
        },
      );
      const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id);

      await seedItems(tx, feed1.id, [{ title: "C1 Item" }]);
      await seedItems(tx, feed2.id, [{ title: "Uncategorized Item" }]);

      const result = await getItems(tx, testUser.id, options);

      expect(result).toHaveLength(2);
    });
  });

  describe("filtering by status", () => {
    test("returns only unread items when status is unread", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item1, item2] = await seedItems(tx, feed.id, [
        { title: "Unread Item" },
        { title: "Read Item" },
      ]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item2.id,
        readAt: new Date(),
      });

      const result = await getItems(tx, testUser.id, {
        ...options,
        status: "unread",
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("Unread Item");
    });

    test("returns only read items when status is read", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item1, item2] = await seedItems(tx, feed.id, [
        { title: "Unread Item" },
        { title: "Read Item" },
      ]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item2.id,
        readAt: new Date(),
      });

      const result = await getItems(tx, testUser.id, {
        ...options,
        status: "read",
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("Read Item");
    });
  });

  describe("isRead calculation", () => {
    test("marks item as read if user has explicit read state", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item.id,
        readAt: new Date(),
      });

      const result = await getItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });

    test("marks item as unread if no state or watermarks exist", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [{ title: "Item 1" }]);

      const result = await getItems(tx, testUser.id, options);
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

      await seedItems(tx, feed.id, [
        { title: "Old Item", createdAt: tenMinutesAgo },
        { title: "New Item", createdAt: now },
      ]);

      await seedUserPreferences(tx, {
        userId: testUser.id,
        markedAllReadAt: fiveMinutesAgo,
      });

      const result = await getItems(tx, testUser.id, options);
      expect(result.find((r) => r.item.title === "Old Item")?.isRead).toBe(
        true,
      );
      expect(result.find((r) => r.item.title === "New Item")?.isRead).toBe(
        false,
      );
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

      await seedItems(tx, feed.id, [
        { title: "Item", createdAt: tenMinutesAgo },
      ]);

      await tx
        .update(categories)
        .set({ markedAllReadAt: now })
        .where(eq(categories.id, cat.id));

      const result = await getItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });

    test("marks item as read if published before subscription watermark", async ({
      tx,
      testUser,
    }) => {
      const { feed, subscription } = await seedFeedWithSubscription(
        tx,
        testUser.id,
      );
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      await seedItems(tx, feed.id, [
        { title: "Item", createdAt: tenMinutesAgo },
      ]);

      await tx
        .update(subscriptions)
        .set({ markedAllReadAt: now })
        .where(eq(subscriptions.id, subscription.id));

      const result = await getItems(tx, testUser.id, options);
      expect(result[0].isRead).toBe(true);
    });

    test("regression: marks late-arriving item as unread even if publishedAt is before watermark", async ({
      tx,
      testUser,
    }) => {
      const { feed, subscription } = await seedFeedWithSubscription(
        tx,
        testUser.id,
      );
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);
      const fiveMinutesAgo = subMinutes(now, 5);

      // 1. Mark as read 5 minutes ago
      await tx
        .update(subscriptions)
        .set({ markedAllReadAt: fiveMinutesAgo })
        .where(eq(subscriptions.id, subscription.id));

      // 2. Item arrives NOW but was "published" 10 minutes ago
      await seedItems(tx, feed.id, [
        {
          title: "Late Arrival",
          publishedAt: tenMinutesAgo,
          createdAt: now,
        },
      ]);

      const result = await getItems(tx, testUser.id, options);
      const item = result.find((r) => r.item.title === "Late Arrival");

      // Should be false because createdAt (now) > watermark (5m ago)
      expect(item?.isRead).toBe(false);
    });

    test("items created before subscription date are always read", async ({
      tx,
      testUser,
    }) => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

      // Create subscription 5 minutes ago (baseline)
      const { feed } = await seedFeedWithSubscription(
        tx,
        testUser.id,
        {},
        { createdAt: fiveMinutesAgo },
      );

      // Seed old and new items
      await seedItems(tx, feed.id, [
        {
          title: "Old Item",
          publishedAt: tenMinutesAgo,
          createdAt: tenMinutesAgo,
        },
        {
          title: "New Item",
          publishedAt: now,
          createdAt: now,
        },
      ]);

      const result = await getItems(tx, testUser.id, options);
      const oldItem = result.find((r) => r.item.title === "Old Item");
      const newItem = result.find((r) => r.item.title === "New Item");

      expect(oldItem?.isRead).toBe(true);
      expect(newItem?.isRead).toBe(false);
    });
  });

  describe("sorting and decoupling", () => {
    test("can sort by bookmarkedAt independently of filtering", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item1, item2] = await seedItems(tx, feed.id, [
        { title: "Item 1" },
        { title: "Item 2" },
      ]);

      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      // Bookmark Item 1 recently, Item 2 earlier
      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item1.id,
        bookmarkedAt: now,
      });
      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item2.id,
        bookmarkedAt: tenMinutesAgo,
      });

      // 1. Sort by bookmarkedAt DESC (default)
      const descResult = await getItems(tx, testUser.id, {
        ...options,
        bookmarkedOnly: true,
        sortBy: "bookmarkedAt",
        sortOrder: "desc",
      });
      expect(descResult[0].item.title).toBe("Item 1");
      expect(descResult[1].item.title).toBe("Item 2");

      // 2. Sort by bookmarkedAt ASC
      const ascResult = await getItems(tx, testUser.id, {
        ...options,
        bookmarkedOnly: true,
        sortBy: "bookmarkedAt",
        sortOrder: "asc",
      });
      expect(ascResult[0].item.title).toBe("Item 2");
      expect(ascResult[1].item.title).toBe("Item 1");
    });

    test("can filter by bookmarkedOnly but sort by publishedAt", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      const [item1, item2] = await seedItems(tx, feed.id, [
        { title: "Older Item", publishedAt: tenMinutesAgo },
        { title: "Newer Item", publishedAt: now },
      ]);

      // Bookmark them in reverse order of publication
      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item1.id,
        bookmarkedAt: now,
      });
      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item2.id,
        bookmarkedAt: tenMinutesAgo,
      });

      // Request bookmarked items sorted by publishedAt DESC
      // (The old 'magic' behavior would have sorted them by bookmarkedAt DESC,
      // showing 'Older Item' first because it was bookmarked more recently)
      const result = await getItems(tx, testUser.id, {
        ...options,
        bookmarkedOnly: true,
        sortBy: "publishedAt",
        sortOrder: "desc",
      });

      expect(result).toHaveLength(2);
      expect(result[0].item.title).toBe("Newer Item");
      expect(result[1].item.title).toBe("Older Item");
    });

    test("sortOrder=asc works for publishedAt", async ({ tx, testUser }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const now = new Date();
      const tenMinutesAgo = subMinutes(now, 10);

      await seedItems(tx, feed.id, [
        { title: "Old", publishedAt: tenMinutesAgo },
        { title: "New", publishedAt: now },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        sortBy: "publishedAt",
        sortOrder: "asc",
      });

      expect(result[0].item.title).toBe("Old");
      expect(result[1].item.title).toBe("New");
    });
  });

  describe("Full-Text Search (FTS)", () => {
    test("returns items matching search keywords in title", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        { title: "React context patterns" },
        { title: "Vue state management" },
        { title: "React performance tips" },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "React",
      });

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.item.title?.includes("React"))).toBe(true);
    });

    test("returns items matching search keywords in textContent (body)", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        {
          title: "Article 1",
          textContent: "This post is about Drizzle ORM and Postgres.",
        },
        { title: "Article 2", textContent: "Just a random blog post." },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "Drizzle",
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("Article 1");
    });

    test("ranks title matches higher than body matches", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        {
          title: "Postgres index types",
          textContent: "Learning about database optimization.",
        },
        {
          title: "A simple guide",
          textContent: "This article mentions Postgres once.",
        },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "Postgres",
      });

      expect(result).toHaveLength(2);
      // Title match should come first due to higher weight ('A')
      expect(result[0].item.title).toBe("Postgres index types");
      expect(result[1].item.title).toBe("A simple guide");
    });

    test("supports stemming (e.g. 'develop' matches 'development')", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        { title: "Modern web development" },
        { title: "Personal developer blog" },
        { title: "Random text" },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "develop",
      });

      expect(result).toHaveLength(2);
      expect(
        result.some((r) => r.item.title === "Modern web development"),
      ).toBe(true);
      expect(
        result.some((r) => r.item.title === "Personal developer blog"),
      ).toBe(true);
    });

    test("returns highlighted snippets when searching", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        {
          title: "The power of Next.js",
          textContent:
            "Next.js provides an excellent developer experience and great performance.",
        },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "performance",
      });

      expect(result[0].searchSnippet).toContain("<b>performance</b>");
    });

    test("search results respect user isolation", async ({ tx, testUser }) => {
      // User 1 subscribed to Feed 1
      const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed1.id, [{ title: "User 1 Article" }]);

      // User 2 (implicitly created or separate) subscribed to Feed 2
      const feed2 = await seedFeed(tx);
      await seedItems(tx, feed2.id, [{ title: "User 2 Article" }]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: "Article",
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("User 1 Article");
    });

    test("supports web search syntax (exact phrases)", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      await seedItems(tx, feed.id, [
        { title: "React State Management" },
        { title: "React Performance State" },
      ]);

      const result = await getItems(tx, testUser.id, {
        ...options,
        search: '"React State"',
      });

      expect(result).toHaveLength(1);
      expect(result[0].item.title).toBe("React State Management");
    });
  });
});
