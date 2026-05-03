import { subMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import {
  seedFeed,
  seedFeedWithSubscription,
  seedItems,
  seedUserItemState,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getItem } from "./get-item";

describe("getItem", () => {
  test("returns the item and source when user is subscribed", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed and subscription
    const { feed } = await seedFeedWithSubscription(tx, testUser.id, {
      title: "Example Feed",
    });

    // 2. Create a feed item
    const [item] = await seedItems(tx, feed.id, [
      { title: "Example Item", content: "Full content here" },
    ]);

    // 3. Retrieve the item
    const result = await getItem(tx, testUser.id, item.id);

    expect(result).not.toBeNull();
    expect(result?.item.id).toBe(item.id);
    expect(result?.item.title).toBe("Example Item");
    expect(result?.item.content).toBe("Full content here");
    expect(result?.feed.id).toBe(feed.id);
    expect(result?.feed.title).toBe("Example Feed");
  });

  test("returns null if the user is NOT subscribed to the parent feed", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed WITHOUT subscription for testUser
    const feed = await seedFeed(tx);

    // 2. Create a feed item
    const [item] = await seedItems(tx, feed.id, [{ title: "Ghost Item" }]);

    // 3. Retrieve the item
    const result = await getItem(tx, testUser.id, item.id);

    expect(result).toBeNull();
  });

  test("returns null if the item does not exist", async ({ tx, testUser }) => {
    const result = await getItem(tx, testUser.id, 999999);
    expect(result).toBeNull();
  });

  test("correctly calculates isRead state", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    // Create an unread item
    const [unreadItem] = await seedItems(tx, feed.id, [{ title: "Unread" }]);
    const unreadResult = await getItem(tx, testUser.id, unreadItem.id);
    expect(unreadResult?.isRead).toBe(false);

    // Create a read item
    const [readItem] = await seedItems(tx, feed.id, [{ title: "Read" }]);
    await seedUserItemState(tx, {
      userId: testUser.id,
      itemId: readItem.id,
      readAt: new Date(),
    });

    const readResult = await getItem(tx, testUser.id, readItem.id);
    expect(readResult?.isRead).toBe(true);
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
    const [item] = await seedItems(tx, feed.id, [
      {
        title: "Late Arrival",
        publishedAt: tenMinutesAgo,
        createdAt: now,
      },
    ]);

    const result = await getItem(tx, testUser.id, item.id);
    expect(result?.isRead).toBe(false);
  });
});
