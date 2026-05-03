import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  feeds,
  subscriptions,
  userItemStates,
  userPreferences,
} from "@/db/schema";
import { isExcerpt } from "@/lib/feed/utils";
import type { ItemWithSource } from "@/types";

/**
 * Retrieves a single feed item with full context, ensuring the user has access.
 */
export async function getItem(
  db: DB,
  userId: string,
  itemId: number,
): Promise<ItemWithSource | null> {
  const [result] = await db
    .select({
      item: feedItems,
      feed: feeds,
      readAt: userItemStates.readAt,
      globalWatermark: userPreferences.markedAllReadAt,
      categoryWatermark: categories.markedAllReadAt,
      subscriptionWatermark: subscriptions.markedAllReadAt,
    })
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
    .where(and(eq(feedItems.id, itemId), eq(subscriptions.userId, userId)))
    .limit(1);

  if (!result) return null;

  const itemTimestamp = result.item.createdAt;

  // Cascading watermark logic
  const watermarks = [
    result.globalWatermark,
    result.categoryWatermark,
    result.subscriptionWatermark,
  ].filter((w): w is Date => w !== null);

  const latestWatermark =
    watermarks.length > 0
      ? new Date(Math.max(...watermarks.map((w) => w.getTime())))
      : null;

  const isRead =
    !!result.readAt || (!!latestWatermark && itemTimestamp <= latestWatermark);

  return {
    item: result.item,
    feed: result.feed,
    isRead,
    isExcerpt: isExcerpt(result.item),
  };
}
