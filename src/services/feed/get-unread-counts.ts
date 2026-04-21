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
}

/**
 * Calculates unread counts for the user respecting individual read states
 * and cascading watermarks (global, category, subscription).
 * 
 * @param db - The database instance.
 * @param userId - The ID of the user to calculate counts for.
 * @returns An object containing the global unread count.
 */
export async function getUnreadCounts(db: DB, userId: string): Promise<UnreadCounts> {
  const publishedAt = sql`COALESCE(${feedItems.publishedAt}, ${feedItems.createdAt})`;

  const result = await db
    .select({
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
        or(isNull(userPreferences.markedAllReadAt), gt(publishedAt, userPreferences.markedAllReadAt)),
        or(isNull(categories.markedAllReadAt), gt(publishedAt, categories.markedAllReadAt)),
        or(isNull(subscriptions.markedAllReadAt), gt(publishedAt, subscriptions.markedAllReadAt))
      ),
    );

  return {
    global: result[0]?.unread ?? 0,
  };
}
