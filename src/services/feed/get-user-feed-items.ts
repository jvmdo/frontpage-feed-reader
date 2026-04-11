import { desc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import type { FeedItemWithSource } from "@/types";

interface GetUserFeedItemsOptions {
  limit?: number;
  offset?: number;
}

/**
 * Retrieves a unified list of feed items for a specific user, joined with source metadata.
 * Items are sorted reverse-chronologically by publication date.
 */
export async function getUserFeedItems(
  db: DB,
  userId: string,
  options: GetUserFeedItemsOptions = {},
): Promise<FeedItemWithSource[]> {
  const { limit = 50, offset = 0 } = options;

  const results = await db
    .select({
      item: feedItems,
      feed: feeds,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}
