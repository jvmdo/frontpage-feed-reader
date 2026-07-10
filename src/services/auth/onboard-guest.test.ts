import { eq, inArray } from "drizzle-orm";
import { feeds, subscriptions, userPreferences } from "@/db/schema";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { CuratedFeedsMissingError } from "@/lib/errors";
import { seedCuratedFeeds } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../../data/sample-feeds.json";
import { onboardGuest } from "./onboard-guest";

describe("onboardGuest", () => {
  const TOTAL_EXPECTED_FEEDS = sampleFeeds.categories.reduce(
    (acc, cat) => acc + cat.feeds.length,
    0,
  );

  test("successfully onboards a guest user with curated feeds and preferences", async ({
    tx,
    testUser,
  }) => {
    // 0. Pre-seed global feeds (simulating bun db:seed)
    await seedCuratedFeeds(tx);

    // 1. Act
    await onboardGuest(tx, testUser.id);

    // 2. Assert: Subscriptions
    const dbSubscriptions = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUser.id));

    expect(dbSubscriptions).toHaveLength(TOTAL_EXPECTED_FEEDS);
    expect(dbSubscriptions.every((s) => s.markedAllReadAt === null)).toBe(true);

    // 3. Assert: User Preferences
    const dbPrefs = await tx.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, testUser.id),
    });
    expect(dbPrefs).toBeDefined();
    expect(dbPrefs?.markedAllReadAt).toBeNull();
  });

  test("succeeds when the welcome feed is absent from the DB", async ({
    tx,
    testUser,
  }) => {
    // 0. Seed only curated category feeds — welcome feed is intentionally absent.
    //    onboardGuest must succeed regardless.
    await seedCuratedFeeds(tx);

    // Confirm the welcome feed is not present
    const welcomeFeed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, WELCOME_FEED_URL),
    });
    expect(welcomeFeed).toBeUndefined();

    // Must not throw
    await expect(onboardGuest(tx, testUser.id)).resolves.not.toThrow();
  });

  test("does not create a subscription to the welcome feed", async ({
    tx,
    testUser,
  }) => {
    await seedCuratedFeeds(tx);
    await onboardGuest(tx, testUser.id);

    const dbSubscriptions = await tx
      .select({ feedId: subscriptions.feedId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUser.id));

    // Resolve feed IDs to URLs for a readable assertion
    const feedIds = dbSubscriptions.map((s) => s.feedId);
    const subscribedFeeds = await tx.query.feeds.findMany({
      where: inArray(feeds.id, feedIds),
    });

    const subscribedUrls = subscribedFeeds.map((f) => f.url);
    expect(subscribedUrls).not.toContain(WELCOME_FEED_URL);
  });

  test("is idempotent and doesn't create duplicate records", async ({
    tx,
    testUser,
  }) => {
    await seedCuratedFeeds(tx);

    // 1. Act: Call twice
    await onboardGuest(tx, testUser.id);
    await onboardGuest(tx, testUser.id);

    // 2. Assert
    const dbSubscriptions = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUser.id));

    expect(dbSubscriptions).toHaveLength(TOTAL_EXPECTED_FEEDS);
  });

  test("throws CuratedFeedsMissingError if required curated feeds are missing from DB", async ({
    tx,
    testUser,
  }) => {
    // DB is empty — no curated category feeds are present.
    await expect(onboardGuest(tx, testUser.id)).rejects.toThrow(
      CuratedFeedsMissingError,
    );
  });
});
