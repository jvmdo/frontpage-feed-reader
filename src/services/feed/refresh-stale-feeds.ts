import { eq, gt, isNull, min, or, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions, userPreferences } from "@/db/schema";
import { ingestItems } from "@/services/ingestion/feed-ingestion";

/**
 * Identifies feeds that are overdue for a refresh based on their subscribers' preferences
 * and triggers ingestion for them in batches.
 */
export async function refreshStaleFeeds(db: DB, batchSize = 20) {
  // 1. Find unique feeds that are overdue.
  // A feed is overdue if (now - lastFetchedAt) > min(subscriber.refreshInterval).
  // We exclude users who have 'manual' refresh (represented as 0).
  const staleFeeds = await db
    .select({
      id: feeds.id,
      url: feeds.url,
      minInterval: min(userPreferences.refreshInterval),
    })
    .from(feeds)
    .innerJoin(subscriptions, eq(subscriptions.feedId, feeds.id))
    .innerJoin(
      userPreferences,
      eq(userPreferences.userId, subscriptions.userId),
    )
    .where(gt(userPreferences.refreshInterval, 0))
    .groupBy(feeds.id)
    .having(
      or(
        isNull(min(feeds.lastFetchedAt)),
        sql`EXTRACT(EPOCH FROM now()) - EXTRACT(EPOCH FROM ${min(feeds.lastFetchedAt)}) > ${min(userPreferences.refreshInterval)}`,
      ),
    )
    .limit(batchSize);

  if (staleFeeds.length === 0) {
    return { processed: 0 };
  }

  // 2. Process them in parallel
  const results = await Promise.allSettled(
    staleFeeds.map(async (feed) => {
      try {
        const result = await ingestItems(db, feed.id);
        return { id: feed.id, url: feed.url, ...result };
      } catch (error) {
        throw {
          id: feed.id,
          url: feed.url,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  const successful = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason);

  return {
    processed: results.length,
    success: successful.length,
    failed: failed.length,
    successful,
    failures: failed,
  };
}
