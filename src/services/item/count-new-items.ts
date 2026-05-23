import { and, count, eq, gt, inArray, isNull, or } from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  feeds,
  subscriptions,
  userPreferences,
} from "@/db/schema";

interface CountNewItemsOptions {
  since: Date;
  feedId?: number | null;
  categoryId?: number | null;
  feedIds?: number[] | null;
}

/**
 * Counts items published after a specific date for a user's subscription scope.
 * Used for background polling to show "New items available" banner.
 */
export async function countNewItems(
  db: DB,
  userId: string,
  options: CountNewItemsOptions,
): Promise<number> {
  const { since, feedId, categoryId, feedIds } = options;

  const [result] = await db
    .select({ value: count() })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .leftJoin(userPreferences, eq(subscriptions.userId, userPreferences.userId))
    .where(
      and(
        eq(subscriptions.userId, userId),
        // We only care about items published after the "since" date
        gt(feedItems.publishedAt, since),
        // Scope filters
        feedId ? eq(feedItems.feedId, feedId) : undefined,
        categoryId ? eq(subscriptions.categoryId, categoryId) : undefined,
        feedIds && feedIds.length > 0
          ? inArray(feedItems.feedId, feedIds)
          : undefined,
        // We only count items that aren't already hidden by watermarks
        or(
          isNull(userPreferences.markedAllReadAt),
          gt(feedItems.createdAt, userPreferences.markedAllReadAt),
        ),
        or(
          isNull(categories.markedAllReadAt),
          gt(feedItems.createdAt, categories.markedAllReadAt),
        ),
        or(
          isNull(subscriptions.markedAllReadAt),
          gt(feedItems.createdAt, subscriptions.markedAllReadAt),
        ),
      ),
    );

  return result.value;
}
