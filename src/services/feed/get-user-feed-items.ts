import { and, desc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  feeds,
  subscriptions,
  userItemStates,
  userPreferences,
} from "@/db/schema";
import type { FeedItemWithSource } from "@/types";

interface GetUserFeedItemsOptions {
  limit: number;
  offset: number;
  feedId?: number;
  categoryId?: number;
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
  const { limit, offset, feedId, categoryId } = options;

  const results = await db
    .select({
      item: feedItems,
      feed: feeds,
      readAt: userItemStates.readAt,
      globalMarkedReadAt: userPreferences.markedAllReadAt,
      categoryMarkedReadAt: categories.markedAllReadAt,
      subscriptionMarkedReadAt: subscriptions.markedAllReadAt,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .leftJoin(
      userPreferences,
      eq(subscriptions.userId, userPreferences.userId),
    )
    .leftJoin(
      userItemStates,
      and(
        eq(feedItems.id, userItemStates.itemId),
        eq(subscriptions.userId, userItemStates.userId),
      ),
    )
    .where(
      and(
        eq(subscriptions.userId, userId),
        feedId ? eq(feedItems.feedId, feedId) : undefined,
        categoryId ? eq(subscriptions.categoryId, categoryId) : undefined,
      ),
    )
    .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map((row) => {
    const publishedAt = row.item.publishedAt || row.item.createdAt;

    const isRead = !!(
      row.readAt ||
      (row.globalMarkedReadAt && publishedAt <= row.globalMarkedReadAt) ||
      (row.categoryMarkedReadAt && publishedAt <= row.categoryMarkedReadAt) ||
      (row.subscriptionMarkedReadAt && publishedAt <= row.subscriptionMarkedReadAt)
    );

    return {
      item: row.item,
      feed: row.feed,
      isRead,
    };
  });
}
