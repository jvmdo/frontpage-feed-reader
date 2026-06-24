import { inArray, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { categories, feeds, subscriptions, userPreferences } from "@/db/schema";
import { WELCOME_FEED_URL } from "@/lib/constants";
import {
  CuratedFeedsMissingError,
  OnboardingInvariantError,
} from "@/lib/errors";
import sampleFeeds from "../../../data/sample-feeds.json";

const CATEGORY_COLORS = [
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
];

/**
 * Onboards a guest user by linking their account to curated feeds already in the database.
 *
 * @param db - Drizzle database instance.
 * @param userId - The ID of the guest user.
 * @throws `CuratedFeedsMissingError` If any required curated feed is missing from the database.
 */
export async function onboardGuest(db: DB, userId: string) {
  // 1. Initialize user preferences if they don't exist yet
  await db
    .insert(userPreferences)
    .values({
      userId,
    })
    .onConflictDoNothing();

  // 2. Resolve Database Records for all feeds (Welcome + Curated)
  const curatedUrls = sampleFeeds.categories.flatMap((c) =>
    c.feeds.map((f) => f.feedUrl),
  );

  const allUrls = [WELCOME_FEED_URL, ...curatedUrls];

  const feedRecords = await db.query.feeds.findMany({
    where: inArray(feeds.url, allUrls),
  });

  // Strict check: Fail fast if the database is not properly seeded
  if (feedRecords.length < allUrls.length) {
    throw new CuratedFeedsMissingError("Missing curated feeds in DB.");
  }

  // Create a bridge to quickly find the Record ID for any URL Definition
  const urlToRecordMap = new Map(feedRecords.map((r) => [r.url, r]));

  // 3. Setup Curated Categories in a single batch insert
  const categoryValues = sampleFeeds.categories.map((categoryData, i) => {
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    return {
      userId,
      name: categoryData.name,
      color,
    };
  });

  const insertedCategories = await db
    .insert(categories)
    .values(categoryValues)
    .onConflictDoUpdate({
      target: [categories.userId, categories.name],
      set: { color: sql`excluded.color` },
    })
    .returning({ id: categories.id, name: categories.name });

  const categoryNameToIdMap = new Map(
    insertedCategories.map((c) => [c.name, c.id]),
  );

  // 4. Setup Curated Subscriptions in a single batch insert
  const subscriptionValues = sampleFeeds.categories.flatMap((categoryData) => {
    const categoryId = categoryNameToIdMap.get(categoryData.name);
    if (categoryId === undefined) {
      throw new OnboardingInvariantError(
        `Failed to resolve category ID for category: ${categoryData.name}`,
      );
    }

    const recordsInCategory = categoryData.feeds.map(
      (feedDef) => urlToRecordMap.get(feedDef.feedUrl)!,
    );

    return recordsInCategory.map((feedRecord) => ({
      userId,
      feedId: feedRecord.id,
      categoryId,
    }));
  });

  await db
    .insert(subscriptions)
    .values(subscriptionValues)
    .onConflictDoNothing();
}
