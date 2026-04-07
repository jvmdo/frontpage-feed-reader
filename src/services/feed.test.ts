import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { feeds, subscriptions, user } from "@/db/schema";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { test } from "@/tests/test-extend";
import {
  addFeedToUser,
  deleteSubscription,
  getSubscriptionWithFeed,
  getUserSubscriptions,
  updateFeedMetadata,
  updateSubscription,
} from "./feed";

describe("addFeedToUser", () => {
  test("adds a new feed and subscription", async ({ tx, testUser }) => {
    // Arrange
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // Act
    const { subscription } = await addFeedToUser(tx, userId, url);
    const feed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, url),
    });

    // Assert
    expect(subscription).toBeDefined();
    expect(subscription.userId).toBe(userId);

    expect(feed).toBeDefined();
    expect(feed?.title).toBe("Example Feed");
    expect(subscription.feedId).toBe(feed?.id);
  });

  test("reuses existing feed and creates subscription", async ({
    tx,
    testUser,
  }) => {
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";
    const [existingFeed] = await tx
      .insert(feeds)
      .values({
        url,
        title: "Old Title",
        healthStatus: "healthy",
      })
      .returning();

    const { subscription } = await addFeedToUser(tx, userId, url);
    const allFeeds = await tx.select().from(feeds);

    expect(subscription.feedId).toBe(existingFeed.id);
    expect(allFeeds.length).toBe(1); // Should not have inserted a new feed
  });

  test("is idempotent for the same user and feed", async ({ tx, testUser }) => {
    // 1. Setup
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // 2. Execute twice
    const { subscription: sub1 } = await addFeedToUser(tx, userId, url);
    const { subscription: sub2 } = await addFeedToUser(tx, userId, url);
    const userSubs = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // 3. Verify
    expect(sub1.id).toBe(sub2.id);
    expect(userSubs.length).toBe(1);
  });

  test("throws FeedNotFoundError when server returns 404", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/404.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 404 })));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedNotFoundError,
    );
  });

  test("throws FeedUnavailableError when server returns 500", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/500.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedUnavailableError,
    );
  });

  test("throws FeedInvalidFormatError when content is not valid XML", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/invalid.xml";
    server.use(http.get(url, () => HttpResponse.text("Not a feed")));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });

  test("throws FeedNetworkError when fetch fails", async ({ tx, testUser }) => {
    const url = "https://example.com/network-error.xml";
    server.use(http.get(url, () => HttpResponse.error()));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedNetworkError,
    );
  });
});

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

describe("updateSubscription", () => {
  test("updates the custom title successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: testUser.id, feedId: feed.id })
      .returning();

    // 2. Update
    const updated = await updateSubscription(tx, testUser.id, sub.id, {
      customTitle: "New Title",
    });

    // 3. Verify
    expect(updated.customTitle).toBe("New Title");

    const [dbSub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, sub.id));
    expect(dbSub.customTitle).toBe("New Title");
  });

  test("throws SubscriptionNotFoundError if the subscription belongs to another user", async ({
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

    // 2. Create a feed and subscription for the other user
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: otherUserId, feedId: feed.id })
      .returning();

    // 3. Attempt to update as the test user
    await expect(
      updateSubscription(tx, testUser.id, sub.id, { customTitle: "Sneaky" }),
    ).rejects.toThrow(SubscriptionNotFoundError);
  });
});

describe("deleteSubscription", () => {
  test("deletes the subscription successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: testUser.id, feedId: feed.id })
      .returning();

    // 2. Delete
    const deleted = await deleteSubscription(tx, testUser.id, sub.id);

    // 3. Verify
    expect(deleted.id).toBe(sub.id);

    const [dbSub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, sub.id));
    expect(dbSub).toBeUndefined();
  });

  test("throws SubscriptionNotFoundError if attempting to delete another user's subscription", async ({
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

    // 2. Create a feed and subscription for the other user
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: otherUserId, feedId: feed.id })
      .returning();

    // 3. Attempt to delete as the test user
    await expect(deleteSubscription(tx, testUser.id, sub.id)).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });
});

describe("updateFeedMetadata", () => {
  test("updates the feed fields correctly", async ({ tx }) => {
    // 1. Create a feed
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A", healthStatus: "unknown" })
      .returning();

    // 2. Update
    const now = new Date();
    const updated = await updateFeedMetadata(tx, feed.id, {
      title: "New Title",
      healthStatus: "healthy",
      lastFetchedAt: now,
    });

    // 3. Verify
    expect(updated.title).toBe("New Title");
    expect(updated.healthStatus).toBe("healthy");
    expect(updated.lastFetchedAt?.getTime()).toBe(now.getTime());

    const [dbFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, feed.id));
    expect(dbFeed.title).toBe("New Title");
    expect(dbFeed.url).toBe("https://a.com"); // Should remain unchanged
  });
});
