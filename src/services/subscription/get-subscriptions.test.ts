import { seedFeedWithSubscription, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getSubscriptions } from "./get-subscriptions";

describe("getSubscriptions", () => {
  test("returns empty array when user has no subscriptions", async ({
    tx,
    testUser,
  }) => {
    const result = await getSubscriptions(tx, testUser.id);
    expect(result).toEqual([]);
  });

  test("returns subscriptions joined with feed data", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed and subscription
    await seedFeedWithSubscription(tx, testUser.id, {
      url: "https://example.com/rss",
    });

    const result = await getSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(1);
    expect(result[0].feed.url).toBe("https://example.com/rss");
    expect(result[0].subscription.userId).toBe(testUser.id);
  });

  test("orders results by feed title alphabetically", async ({
    tx,
    testUser,
  }) => {
    // 1. Create feeds and subscriptions
    await seedFeedWithSubscription(tx, testUser.id, {
      title: "B Feed",
    });

    await seedFeedWithSubscription(tx, testUser.id, {
      title: "A Feed",
    });

    const result = await getSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(2);
    expect(result[0].feed.title).toBe("A Feed");
    expect(result[1].feed.title).toBe("B Feed");
  });

  test("only returns subscriptions for the requested user", async ({
    tx,
    testUser,
  }) => {
    // 1. Create another user
    const otherUser = await seedUser(tx);

    // 2. Create a feed and subscription for other user
    await seedFeedWithSubscription(tx, otherUser.id);

    const result = await getSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(0);
  });
});
