import { eq } from "drizzle-orm";
import { subscriptions, userPreferences } from "@/db/schema";
import { CuratedFeedsMissingError } from "@/lib/errors";
import { seedCuratedFeeds } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../../data/sample-feeds.json";
import { onboardGuest } from "./onboard-guest";

describe("onboardGuest", () => {
  const TOTAL_EXPECTED_FEEDS =
    1 + // Welcome feed
    sampleFeeds.categories.reduce((acc, cat) => acc + cat.feeds.length, 0);

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

    // 3. Assert: User Preferences
    const dbPrefs = await tx.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, testUser.id),
    });
    expect(dbPrefs).toBeDefined();
    expect(dbPrefs?.markedAllReadAt).toBeDefined();
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
    // 1. Act & Assert: Should throw because DB is empty
    await expect(onboardGuest(tx, testUser.id)).rejects.toThrow(
      CuratedFeedsMissingError,
    );
  });
});
