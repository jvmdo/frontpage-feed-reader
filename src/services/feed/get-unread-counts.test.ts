import { subMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { categories, subscriptions } from "@/db/schema";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
  seedUserItemState,
  seedUserPreferences,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getUnreadCounts } from "./get-unread-counts";

describe("getUnreadCounts", () => {
  test("returns 0 when user has no subscriptions", async ({ tx, testUser }) => {
    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(0);
    expect(result.categories).toEqual({});
    expect(result.feeds).toEqual({});
  });

  test("counts unread items from subscribed feeds", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    await seedItems(tx, feed.id, [{ title: "Item 1" }, { title: "Item 2" }]);

    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(2);
    expect(result.feeds[feed.id]).toBe(2);
  });

  test("calculates breakdown for multiple categories and feeds", async ({
    tx,
    testUser,
  }) => {
    const cat1 = await seedCategory(tx, { userId: testUser.id, name: "Tech" });
    const cat2 = await seedCategory(tx, { userId: testUser.id, name: "News" });

    // Feed 1 in Cat 1
    const { feed: f1 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: cat1.id },
    );
    await seedItems(tx, f1.id, [{ title: "F1 I1" }, { title: "F1 I2" }]);

    // Feed 2 in Cat 1
    const { feed: f2 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: cat1.id },
    );
    await seedItems(tx, f2.id, [{ title: "F2 I1" }]);

    // Feed 3 in Cat 2
    const { feed: f3 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: cat2.id },
    );
    await seedItems(tx, f3.id, [
      { title: "F3 I1" },
      { title: "F3 I2" },
      { title: "F3 I3" },
    ]);

    // Feed 4 (Uncategorized)
    const { feed: f4 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: null },
    );
    await seedItems(tx, f4.id, [{ title: "F4 I1" }]);

    const result = await getUnreadCounts(tx, testUser.id);

    expect(result.global).toBe(7);
    expect(result.categories[cat1.id]).toBe(3);
    expect(result.categories[cat2.id]).toBe(3);
    expect(result.feeds[f1.id]).toBe(2);
    expect(result.feeds[f2.id]).toBe(1);
    expect(result.feeds[f3.id]).toBe(3);
    expect(result.feeds[f4.id]).toBe(1);
  });

  test("excludes items marked as read explicitly", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item1] = await seedItems(tx, feed.id, [
      { title: "Item 1" },
      { title: "Item 2" },
    ]);

    await seedUserItemState(tx, {
      userId: testUser.id,
      itemId: item1.id,
      readAt: new Date(),
    });

    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(1);
    expect(result.feeds[feed.id]).toBe(1);
  });

  test("respects global watermark", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();
    const tenMinutesAgo = subMinutes(now, 10);
    const fiveMinutesAgo = subMinutes(now, 5);

    await seedItems(tx, feed.id, [
      { title: "Old", createdAt: tenMinutesAgo },
      { title: "New", createdAt: now },
    ]);

    await seedUserPreferences(tx, {
      userId: testUser.id,
      markedAllReadAt: fiveMinutesAgo,
    });

    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(1);
  });

  test("respects category watermark", async ({ tx, testUser }) => {
    const cat = await seedCategory(tx, { userId: testUser.id, name: "Tech" });
    const { feed } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {},
      { categoryId: cat.id },
    );
    const now = new Date();
    const tenMinutesAgo = subMinutes(now, 10);

    await seedItems(tx, feed.id, [{ title: "Old", createdAt: tenMinutesAgo }]);

    await tx
      .update(categories)
      .set({ markedAllReadAt: now })
      .where(eq(categories.id, cat.id));

    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(0);
  });

  test("respects subscription watermark", async ({ tx, testUser }) => {
    const { feed, subscription } = await seedFeedWithSubscription(
      tx,
      testUser.id,
    );
    const now = new Date();
    const tenMinutesAgo = subMinutes(now, 10);

    await seedItems(tx, feed.id, [{ title: "Old", createdAt: tenMinutesAgo }]);

    await tx
      .update(subscriptions)
      .set({ markedAllReadAt: now })
      .where(eq(subscriptions.id, subscription.id));

    const result = await getUnreadCounts(tx, testUser.id);
    expect(result.global).toBe(0);
  });

  test("regression: late-arriving items are unread even if publishedAt is before watermark", async ({
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

    // 1. Mark feed as read 5 minutes ago
    await tx
      .update(subscriptions)
      .set({ markedAllReadAt: fiveMinutesAgo })
      .where(eq(subscriptions.id, subscription.id));

    // 2. A "new" item arrives NOW, but its internal 'publishedAt' is 10 minutes ago
    // (Simulating a backdated post or ingestion delay)
    await seedItems(tx, feed.id, [
      {
        title: "Late Arrival",
        publishedAt: tenMinutesAgo,
        createdAt: now, // Important: arrived AFTER the watermark
      },
    ]);

    const result = await getUnreadCounts(tx, testUser.id);

    // After fix: This should be 1 because it arrived (createdAt) after the watermark (5m ago)
    expect(result.global).toBe(1);
  });

  describe("bookmarks", () => {
    test("counts unread bookmarked items", async ({ tx, testUser }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item1, item2] = await seedItems(tx, feed.id, [
        { title: "I1" },
        { title: "I2" },
      ]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item1.id,
        bookmarkedAt: new Date(),
      });

      const result = await getUnreadCounts(tx, testUser.id);
      expect(result.saved).toBe(1);
    });

    test("excludes bookmarked items that are already read", async ({
      tx,
      testUser,
    }) => {
      const { feed } = await seedFeedWithSubscription(tx, testUser.id);
      const [item1] = await seedItems(tx, feed.id, [{ title: "I1" }]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item1.id,
        bookmarkedAt: new Date(),
        readAt: new Date(),
      });

      const result = await getUnreadCounts(tx, testUser.id);
      expect(result.saved).toBe(0);
    });

    test("respects cascading watermarks for bookmarked items", async ({
      tx,
      testUser,
    }) => {
      const { feed, subscription } = await seedFeedWithSubscription(
        tx,
        testUser.id,
      );
      const tenMinutesAgo = subMinutes(new Date(), 10);
      const [item1] = await seedItems(tx, feed.id, [
        { title: "I1", createdAt: tenMinutesAgo },
      ]);

      await seedUserItemState(tx, {
        userId: testUser.id,
        itemId: item1.id,
        bookmarkedAt: new Date(),
      });

      // Mark subscription as read NOW
      await tx
        .update(subscriptions)
        .set({ markedAllReadAt: new Date() })
        .where(eq(subscriptions.id, subscription.id));

      const result = await getUnreadCounts(tx, testUser.id);
      expect(result.saved).toBe(0);
    });
  });
});
