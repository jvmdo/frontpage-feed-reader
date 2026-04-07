import { feeds, subscriptions, user } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { getSubscriptionWithFeed } from "./get-subscriptions-with-feed";

describe("getSubscriptionWithFeed", () => {
  test("returns subscription joined with feed data", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed
    const [feed] = await tx
      .insert(feeds)
      .values({
        url: "https://example.com/rss",
        title: "Example Feed",
      })
      .returning();

    // 2. Create a subscription
    const [sub] = await tx
      .insert(subscriptions)
      .values({
        userId: testUser.id,
        feedId: feed.id,
      })
      .returning();

    const result = await getSubscriptionWithFeed(tx, testUser.id, sub.id);

    expect(result).toBeDefined();
    expect(result?.subscription.id).toBe(sub.id);
    expect(result?.feed.url).toBe("https://example.com/rss");
  });

  test("returns undefined if the subscription belongs to another user", async ({
    tx,
    testUser,
  }) => {
    // 1. Create another user
    const otherUserId = "other_user_id";
    await tx.insert(user).values({
      id: otherUserId,
      email: "other@example.com",
      name: "Other User",
    });

    // 2. Create a feed
    const [feed] = await tx
      .insert(feeds)
      .values({
        url: "https://example.com/rss",
        title: "Example Feed",
      })
      .returning();

    // 3. Create a subscription for a different user
    const [sub] = await tx
      .insert(subscriptions)
      .values({
        userId: otherUserId,
        feedId: feed.id,
      })
      .returning();

    // 4. Attempt to fetch it as the test user
    const result = await getSubscriptionWithFeed(tx, testUser.id, sub.id);

    expect(result).toBeUndefined();
  });

  test("returns undefined if the subscription does not exist", async ({
    tx,
    testUser,
  }) => {
    const result = await getSubscriptionWithFeed(tx, testUser.id, 9999);
    expect(result).toBeUndefined();
  });
});
