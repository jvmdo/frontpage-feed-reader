import { and, desc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import type { FeedItemWithSource } from "@/types";

interface GetUserFeedItemsOptions {
  limit: number;
  offset: number;
  feedId?: number;
}

/**
 * Retrieves a unified list of feed items for a specific user, joined with source metadata.
 * Items are sorted reverse-chronologically by publication date.
 */
export async function getUserFeedItems(
  db: DB,
  userId: string,
  options: GetUserFeedItemsOptions,
): Promise<FeedItemWithSource[]> {
  const { limit, offset, feedId } = options;

  const results = await db
    .select({
      item: feedItems,
      feed: feeds,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .where(
      and(
        eq(subscriptions.userId, userId),
        feedId ? eq(feedItems.feedId, feedId) : undefined,
      ),
    )
    .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}
