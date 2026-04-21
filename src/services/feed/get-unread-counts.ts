import { and, count, eq, gt, isNull, or, sql } from "drizzle-orm";
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
}

/**
 * Calculates unread counts for the user respecting individual read states
 * and cascading watermarks (global, category, subscription).
 *
 * @param db - The database instance.
 * @param userId - The ID of the user to calculate counts for.
 * @returns An object containing the global, category, and feed unread counts.
 */
export async function getUnreadCounts(
  db: DB,
  userId: string,
): Promise<UnreadCounts> {
  const publishedAt = sql`COALESCE(${feedItems.publishedAt}, ${feedItems.createdAt})`;

  const results = await db
    .select({
      feedId: feedItems.feedId,
      categoryId: subscriptions.categoryId,
      unread: count(feedItems.id),
    })
    .from(feedItems)
    .innerJoin(subscriptions, eq(feedItems.feedId, subscriptions.feedId))
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .leftJoin(userPreferences, eq(subscriptions.userId, userPreferences.userId))
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
          gt(publishedAt, userPreferences.markedAllReadAt),
        ),
        or(
          isNull(categories.markedAllReadAt),
          gt(publishedAt, categories.markedAllReadAt),
        ),
        or(
          isNull(subscriptions.markedAllReadAt),
          gt(publishedAt, subscriptions.markedAllReadAt),
        ),
      ),
    )
    .groupBy(feedItems.feedId, subscriptions.categoryId);

  const counts: UnreadCounts = {
    global: 0,
    categories: {},
    feeds: {},
  };

  for (const row of results) {
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
