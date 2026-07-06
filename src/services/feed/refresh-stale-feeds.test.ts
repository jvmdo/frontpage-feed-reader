import { subSeconds } from "date-fns";
import { eq } from "drizzle-orm";
import { feeds, subscriptions, user, userPreferences } from "@/db/schema";
import { env } from "@/env";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { seedFeed, seedFeedWithSubscription } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { refreshStaleFeeds } from "./refresh-stale-feeds";

vi.mock("@/services/ingestion/feed-ingestion");

describe("refreshStaleFeeds", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(ingestItems).mockResolvedValue({
      success: true,
      status: "fetched",
    });
  });

  test("refreshes a curated feed with zero subscribers", async ({ tx }) => {
    // 1. Create a curated feed with no subscriptions
    const feed = await seedFeed(tx, { isCurated: true, lastFetchedAt: null });

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(1);
    expect(result.success).toBe(1);
    expect(result.successful?.[0]?.id).toBe(feed.id);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("refreshes a curated feed that exceeded DEFAULT_REFRESH_INTERVAL", async ({
    tx,
  }) => {
    // 1. Create a curated feed stale by 1 second more than the default
    const staleTime = env.NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL + 1;
    const feed = await seedFeed(tx, {
      isCurated: true,
      lastFetchedAt: subSeconds(new Date(), staleTime),
    });

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(1);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("skips a curated feed that is not yet stale", async ({ tx }) => {
    // 1. Create a curated feed refreshed 10 seconds ago
    await seedFeed(tx, {
      isCurated: true,
      lastFetchedAt: subSeconds(new Date(), 10),
    });

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(0);
    expect(ingestItems).not.toHaveBeenCalled();
  });

  test("skips a standard feed with zero subscribers", async ({ tx }) => {
    // 1. Create a standard feed with no subscriptions
    await seedFeed(tx, { isCurated: false, lastFetchedAt: null });

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(0);
    expect(ingestItems).not.toHaveBeenCalled();
  });

  test("refreshes a feed that has never been fetched (NULL lastFetchedAt)", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed with NULL lastFetchedAt
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 900,
    });

    await tx
      .update(feeds)
      .set({ lastFetchedAt: null })
      .where(eq(feeds.id, feed.id));

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(1);
    expect(result.success).toBe(1);
    expect(result.successful?.[0]?.id).toBe(feed.id);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("refreshes a feed that has exceeded its interval", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed with a 15-minute (900s) interval preference
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 900,
    });

    // 2. Make it stale (lastFetchedAt was 20 minutes ago)
    await tx
      .update(feeds)
      .set({ lastFetchedAt: subSeconds(new Date(), 1200) })
      .where(eq(feeds.id, feed.id));

    // 3. Act
    const result = await refreshStaleFeeds(tx);

    // 4. Assert
    expect(result.processed).toBe(1);
    expect(result.success).toBe(1);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("skips a feed that has not yet exceeded its interval", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed with a 30-minute (1800s) interval preference
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 1800,
    });

    // 2. Make it fresh (lastFetchedAt was 10 minutes ago)
    await tx
      .update(feeds)
      .set({ lastFetchedAt: subSeconds(new Date(), 600) })
      .where(eq(feeds.id, feed.id));

    // 3. Act
    const result = await refreshStaleFeeds(tx);

    // 4. Assert
    expect(result.processed).toBe(0);
    expect(ingestItems).not.toHaveBeenCalled();
  });

  test("skips feeds for users with 'Manual Only' (0) interval", async ({
    tx,
    testUser,
  }) => {
    // 1. Set to Manual
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 0,
    });

    // 2. lastFetchedAt is very old
    await tx
      .update(feeds)
      .set({ lastFetchedAt: subSeconds(new Date(), 999999) })
      .where(eq(feeds.id, feed.id));

    // 3. Act
    const result = await refreshStaleFeeds(tx);

    // 4. Assert
    expect(result.processed).toBe(0);
    expect(ingestItems).not.toHaveBeenCalled();
  });

  test("picks the shortest interval when multiple users subscribe to the same feed", async ({
    tx,
    testUser,
  }) => {
    // 1. Feed subscribed by User A (30m) and User B (15m)
    const { feed } = await seedFeedWithSubscription(tx, testUser.id); // User A

    // Seed another user
    const [userB] = await tx
      .insert(user)
      .values({
        id: "user-b",
        name: "User B",
        email: "b@example.com",
      })
      .returning();

    await tx
      .insert(userPreferences)
      .values({ userId: userB.id, refreshInterval: 900 });

    await tx.insert(subscriptions).values({
      userId: userB.id,
      feedId: feed.id,
    });

    // 2. Set interval for User A (testUser) to 1800
    await tx
      .update(userPreferences)
      .set({ refreshInterval: 1800 })
      .where(eq(userPreferences.userId, testUser.id));

    // 3. Make feed stale for User B (20m ago) but fresh for User A (User A wanted 30m)
    await tx
      .update(feeds)
      .set({ lastFetchedAt: subSeconds(new Date(), 1200) })
      .where(eq(feeds.id, feed.id));

    // 4. Act
    const result = await refreshStaleFeeds(tx);

    // 5. Assert: It should refresh because of User B
    expect(result.processed).toBe(1);
    expect(result.success).toBe(1);
    expect(ingestItems).toHaveBeenCalled();
  });

  test("reports detailed failures when ingestion fails", async ({
    tx,
    testUser,
  }) => {
    // 1. Setup a stale feed
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 900,
    });

    vi.mocked(ingestItems).mockRejectedValue(new Error("Network Timeout"));

    // 2. Act
    const result = await refreshStaleFeeds(tx);

    // 3. Assert
    expect(result.processed).toBe(1);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failures?.[0]).toEqual({
      id: feed.id,
      url: feed.url,
      error: "Network Timeout",
    });
  });

  test("respects the batch size limit", async ({ tx }) => {
    // 1. Create multiple stale curated feeds (more than the batch size of 2)
    await seedFeed(tx, { isCurated: true, lastFetchedAt: null });
    await seedFeed(tx, { isCurated: true, lastFetchedAt: null });
    await seedFeed(tx, { isCurated: true, lastFetchedAt: null });

    // 2. Act with a batch size of 2
    const result = await refreshStaleFeeds(tx, 2);

    // 3. Assert
    expect(result.processed).toBe(2);
    expect(result.success).toBe(2);
    expect(ingestItems).toHaveBeenCalledTimes(2);
  });

  test("deduplicates feeds that are both curated and subscribed", async ({
    tx,
    testUser,
  }) => {
    // 1. Create a feed that is curated and stale
    const feed = await seedFeed(tx, { isCurated: true, lastFetchedAt: null });

    // 2. Subscribe a user to the same feed
    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 900,
    });
    await tx.insert(subscriptions).values({
      userId: testUser.id,
      feedId: feed.id,
    });

    // 3. Act with a large batch size
    const result = await refreshStaleFeeds(tx, 10);

    // 4. Assert
    expect(result.processed).toBe(1);
    expect(result.success).toBe(1);
    // Ensure ingestItems was only called once for this feed!
    expect(ingestItems).toHaveBeenCalledTimes(1);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("prioritizes feeds that have been waiting the longest, including never fetched feeds (NULLS FIRST)", async ({
    tx,
  }) => {
    // 1. Create three curated feeds with different staleness
    // DEFAULT_REFRESH_INTERVAL is usually 600s (10 mins). These are all stale.
    const oneHourAgo = subSeconds(new Date(), 3600);
    const twentyMinsAgo = subSeconds(new Date(), 1200);

    const neverFetchedFeed = await seedFeed(tx, {
      isCurated: true,
      lastFetchedAt: null,
    });
    const olderFeed = await seedFeed(tx, {
      isCurated: true,
      lastFetchedAt: oneHourAgo,
    });
    const oldFeed = await seedFeed(tx, {
      isCurated: true,
      lastFetchedAt: twentyMinsAgo,
    });

    // 2. Act with a batch size of 2
    const result = await refreshStaleFeeds(tx, 2);

    // 3. Assert: should pick the null feed and the older feed
    expect(result.processed).toBe(2);

    const processedIds = result.successful?.map((r) => r.id);
    expect(processedIds).toContain(neverFetchedFeed.id);
    expect(processedIds).toContain(olderFeed.id);
    expect(processedIds).not.toContain(oldFeed.id);
  });
});
