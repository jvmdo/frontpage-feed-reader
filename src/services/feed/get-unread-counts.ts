import { and, count, eq, gt, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  subscriptions,
  userItemStates,
  userPreferences,
} from "@/db/schema";

export interface UnreadCounts {
  global: number;
  categories: Record<number, number>;
  feeds: Record<number, number>;
  saved: number;
}

/**
 * Calculates unread counts for the user respecting individual read states
 * and cascading watermarks (global, category, subscription).
 *
 * @param db - The database instance.
 * @param userId - The ID of the user to calculate counts for.
 * @returns An object containing the global, category, feed, and saved unread counts.
 */
export async function getUnreadCounts(
  db: DB,
  userId: string,
): Promise<UnreadCounts> {
  const itemTimestamp = feedItems.createdAt;

  const [groupResults, savedResult] = await Promise.all([
    // Query for global, category, and feed counts
    db
      .select({
        feedId: feedItems.feedId,
        categoryId: subscriptions.categoryId,
        unread: count(feedItems.id),
      })
      .from(feedItems)
      .innerJoin(subscriptions, eq(feedItems.feedId, subscriptions.feedId))
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
          isNull(userItemStates.readAt),
          or(
            isNull(userPreferences.markedAllReadAt),
            gt(itemTimestamp, userPreferences.markedAllReadAt),
          ),
          or(
            isNull(categories.markedAllReadAt),
            gt(itemTimestamp, categories.markedAllReadAt),
          ),
          or(
            isNull(subscriptions.markedAllReadAt),
            gt(itemTimestamp, subscriptions.markedAllReadAt),
          ),
        ),
      )
      .groupBy(feedItems.feedId, subscriptions.categoryId),

    // Query for unread bookmarks count
    db
      .select({
        unread: count(feedItems.id),
      })
      .from(feedItems)
      .innerJoin(subscriptions, eq(feedItems.feedId, subscriptions.feedId))
      .innerJoin(
        userItemStates,
        and(
          eq(feedItems.id, userItemStates.itemId),
          eq(subscriptions.userId, userItemStates.userId),
        ),
      )
      .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
      .leftJoin(
        userPreferences,
        eq(subscriptions.userId, userPreferences.userId),
      )
      .where(
        and(
          eq(subscriptions.userId, userId),
          isNotNull(userItemStates.bookmarkedAt),
          isNull(userItemStates.readAt),
          or(
            isNull(userPreferences.markedAllReadAt),
            gt(itemTimestamp, userPreferences.markedAllReadAt),
          ),
          or(
            isNull(categories.markedAllReadAt),
            gt(itemTimestamp, categories.markedAllReadAt),
          ),
          or(
            isNull(subscriptions.markedAllReadAt),
            gt(itemTimestamp, subscriptions.markedAllReadAt),
          ),
        ),
      ),
  ]);

  const counts: UnreadCounts = {
    global: 0,
    categories: {},
    feeds: {},
    saved: savedResult[0] ? Number(savedResult[0].unread) : 0,
  };

  for (const row of groupResults) {
    const unread = Number(row.unread);
    const feedId = Number(row.feedId);
    const categoryId = row.categoryId ? Number(row.categoryId) : null;

    counts.global += unread;
    counts.feeds[feedId] = (counts.feeds[feedId] || 0) + unread;

    if (categoryId !== null) {
      counts.categories[categoryId] =
        (counts.categories[categoryId] || 0) + unread;
    }
  }

  return counts;
}
