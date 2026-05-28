import { and, eq, gt, isNull, min, or, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions, userPreferences } from "@/db/schema";
import { DEFAULT_REFRESH_INTERVAL } from "@/lib/constants";
import { ingestItems } from "@/services/ingestion/feed-ingestion";

/**
 * Identifies feeds that are overdue for a refresh based on their subscribers' preferences
 * OR because they are marked as curated global feeds.
 * Triggers ingestion for them in batches.
 */
export async function refreshStaleFeeds(db: DB, batchSize = 20) {
  // 1. Find unique feeds that are overdue.

  // A. Subscribed feeds: overdue if (now - lastFetchedAt) > min(subscriber.refreshInterval)
  // We exclude users who have 'manual' refresh (represented as 0).
  const subscribedStale = await db
    .select({
      id: feeds.id,
      url: feeds.url,
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

  // B. Curated feeds: overdue if (now - lastFetchedAt) > DEFAULT_REFRESH_INTERVAL
  const curatedStale = await db
    .select({
      id: feeds.id,
      url: feeds.url,
    })
    .from(feeds)
    .where(
      and(
        eq(feeds.isCurated, true),
        or(
          isNull(feeds.lastFetchedAt),
          sql`EXTRACT(EPOCH FROM now()) - EXTRACT(EPOCH FROM ${feeds.lastFetchedAt}) > ${DEFAULT_REFRESH_INTERVAL}`,
        ),
      ),
    )
    .limit(batchSize);

  // 2. Combine and Deduplicate
  const allStale = [...subscribedStale, ...curatedStale];
  const uniqueFeedsMap = new Map<number, { id: number; url: string }>();

  for (const feed of allStale) {
    if (!uniqueFeedsMap.has(feed.id)) {
      uniqueFeedsMap.set(feed.id, feed);
    }
  }

  const feedsToRefresh = Array.from(uniqueFeedsMap.values()).slice(
    0,
    batchSize,
  );

  if (feedsToRefresh.length === 0) {
    return { processed: 0 };
  }

  // 3. Process them in parallel
  const results = await Promise.allSettled(
    feedsToRefresh.map(async (feed) => {
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
