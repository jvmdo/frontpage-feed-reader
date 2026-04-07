import { feeds, subscriptions, user } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { getUserSubscriptions } from "./get-user-subscriptions";

describe("getUserSubscriptions", () => {
  test("returns empty array when user has no subscriptions", async ({
    tx,
    testUser,
  }) => {
    const result = await getUserSubscriptions(tx, testUser.id);
    expect(result).toEqual([]);
  });

  test("returns subscriptions joined with feed data", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed
    const [feed] = await tx
      .insert(feeds)
      .values({
        url: "https://example.com/rss",
        title: "Example Feed",
        healthStatus: "healthy",
      })
      .returning();

    // 2. Create a subscription
    await tx.insert(subscriptions).values({
      userId: testUser.id,
      feedId: feed.id,
    });

    const result = await getUserSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(1);
    expect(result[0].feed.url).toBe("https://example.com/rss");
    expect(result[0].subscription.userId).toBe(testUser.id);
  });

  test("orders results by feed title alphabetically", async ({
    tx,
    testUser,
  }) => {
    // 1. Create feeds
    const [feedB] = await tx
      .insert(feeds)
      .values({
        url: "https://b.com/rss",
        title: "B Feed",
      })
      .returning();

    const [feedA] = await tx
      .insert(feeds)
      .values({
        url: "https://a.com/rss",
        title: "A Feed",
      })
      .returning();

    // 2. Create subscriptions
    await tx.insert(subscriptions).values([
      { userId: testUser.id, feedId: feedB.id },
      { userId: testUser.id, feedId: feedA.id },
    ]);

    const result = await getUserSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(2);
    expect(result[0].feed.title).toBe("A Feed");
    expect(result[1].feed.title).toBe("B Feed");
  });

  test("only returns subscriptions for the requested user", async ({
    tx,
    testUser,
  }) => {
    // 1. Create another user
    const otherUserId = "other_user";
    await tx.insert(user).values({
      id: otherUserId,
      name: "Other User",
      email: "other@example.com",
    });

    // 2. Create a feed
    const [feed] = await tx
      .insert(feeds)
      .values({
        url: "https://example.com/rss",
        title: "Example Feed",
      })
      .returning();

    // 3. Subscribe other user only
    await tx.insert(subscriptions).values({
      userId: otherUserId,
      feedId: feed.id,
    });

    const result = await getUserSubscriptions(tx, testUser.id);

    expect(result).toHaveLength(0);
  });
});
