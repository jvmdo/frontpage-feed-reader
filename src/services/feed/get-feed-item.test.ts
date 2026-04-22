import {
  seedFeed,
  seedFeedItems,
  seedFeedWithSubscription,
  seedUserItemState,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getFeedItem } from "./get-feed-item";

describe("getFeedItem", () => {
  test("returns the item and source when user is subscribed", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed and subscription
    const { feed } = await seedFeedWithSubscription(tx, testUser.id, {
      title: "Example Feed",
    });

    // 2. Create a feed item
    const [item] = await seedFeedItems(tx, feed.id, [
      { title: "Example Item", content: "Full content here" },
    ]);

    // 3. Retrieve the item
    const result = await getFeedItem(tx, testUser.id, item.id);

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
    const [item] = await seedFeedItems(tx, feed.id, [{ title: "Ghost Item" }]);

    // 3. Retrieve the item
    const result = await getFeedItem(tx, testUser.id, item.id);

    expect(result).toBeNull();
  });

  test("returns null if the item does not exist", async ({ tx, testUser }) => {
    const result = await getFeedItem(tx, testUser.id, 999999);
    expect(result).toBeNull();
  });

  test("correctly calculates isRead state", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    // Create an unread item
    const [unreadItem] = await seedFeedItems(tx, feed.id, [
      { title: "Unread" },
    ]);
    const unreadResult = await getFeedItem(tx, testUser.id, unreadItem.id);
    expect(unreadResult?.isRead).toBe(false);

    // Create a read item
    const [readItem] = await seedFeedItems(tx, feed.id, [{ title: "Read" }]);
    await seedUserItemState(tx, {
      userId: testUser.id,
      itemId: readItem.id,
      readAt: new Date(),
    });

    const readResult = await getFeedItem(tx, testUser.id, readItem.id);
    expect(readResult?.isRead).toBe(true);
  });
});
