import { and, count, eq, gt, inArray, isNull } from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  feeds,
  subscriptions,
  userItemStates,
  userPreferences,
} from "@/db/schema";
import { watermarkFilters } from "../utils";

interface CountNewItemsOptions {
  since: Date;
  feedId?: number | null;
  categoryId?: number | null;
  feedIds?: number[] | null;
  unreadOnly?: boolean;
}

/**
 * Counts items published (publishedAt) after a specific date for a user's subscription scope.
 * Used for background polling to show "New items available" banner.
 */
export async function countNewItems(
  db: DB,
  userId: string,
  options: CountNewItemsOptions,
): Promise<number> {
  const { since, feedId, categoryId, feedIds, unreadOnly } = options;

  const [result] = await db
    .select({ value: count() })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .leftJoin(userPreferences, eq(subscriptions.userId, userPreferences.userId))
    .leftJoin(
      userItemStates,
      and(
        eq(feedItems.id, userItemStates.itemId),
        eq(userItemStates.userId, userId),
      ),
    )
    .where(
      and(
        eq(subscriptions.userId, userId),
        // We only count items published (publishedAt) after the "since" date.
        // This ensures the banner only shows for items that will sort to the top of the feed list.
        gt(feedItems.publishedAt, since),
        // Scope filters
        feedId ? eq(feedItems.feedId, feedId) : undefined,
        categoryId ? eq(subscriptions.categoryId, categoryId) : undefined,
        feedIds && feedIds.length > 0
          ? inArray(feedItems.feedId, feedIds)
          : undefined,
        unreadOnly ? isNull(userItemStates.readAt) : undefined,
        // We only count items that aren't already hidden by watermarks
        ...watermarkFilters(feedItems.createdAt, feedItems.publishedAt),
      ),
    );

  return result.value;
}
