import { inArray } from "drizzle-orm";
import type { DB } from "@/db";
import { categories, feeds, subscriptions, userPreferences } from "@/db/schema";
import { DEFAULT_CATEGORY_COLOR, WELCOME_FEED_URL } from "@/lib/constants";
import { CuratedFeedsMissingError } from "@/lib/errors";
import sampleFeeds from "../../../data/sample-feeds.json";

const CATEGORY_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#ca8a04", // yellow-600
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
  // 1. Initialize user preferences with a 7-day historical watermark
  await db
    .insert(userPreferences)
    .values({
      userId,
      markedAllReadAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

  // 3. Setup Categories and Subscriptions

  // Step A: Welcome Category ("Getting Started")
  const [welcomeCategory] = await db
    .insert(categories)
    .values({
      userId,
      name: "Getting Started",
      color: DEFAULT_CATEGORY_COLOR,
    })
    .onConflictDoUpdate({
      target: [categories.userId, categories.name],
      set: { color: DEFAULT_CATEGORY_COLOR },
    })
    .returning({ id: categories.id });

  const welcomeFeedRecord = urlToRecordMap.get(WELCOME_FEED_URL)!;
  await db
    .insert(subscriptions)
    .values({
      userId,
      feedId: welcomeFeedRecord.id,
      categoryId: welcomeCategory.id,
    })
    .onConflictDoNothing();

  // Step B: Curated Categories
  const curatedCategoryPromises = sampleFeeds.categories.map(
    async (categoryData, i) => {
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

      // Upsert category record
      const [categoryRecord] = await db
        .insert(categories)
        .values({
          userId,
          name: categoryData.name,
          color,
        })
        .onConflictDoUpdate({
          target: [categories.userId, categories.name],
          set: { color },
        })
        .returning({ id: categories.id });

      // Use the bridge to get the Database Records for the feeds in this category
      const recordsInCategory = categoryData.feeds.map(
        (feedDef) => urlToRecordMap.get(feedDef.feedUrl)!,
      );

      // Create subscription records directly linking user to feed records
      const subscriptionValues = recordsInCategory.map((feedRecord) => ({
        userId,
        feedId: feedRecord.id,
        categoryId: categoryRecord.id,
      }));

      await db
        .insert(subscriptions)
        .values(subscriptionValues)
        .onConflictDoNothing();
    },
  );

  await Promise.all(curatedCategoryPromises);
}
