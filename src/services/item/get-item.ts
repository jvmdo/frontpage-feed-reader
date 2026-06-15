import { and, eq, getTableColumns } from "drizzle-orm";
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
import { calculateIsRead } from "../utils";

/**
 * Retrieves a single feed item with full context, ensuring the user has access.
 */
export async function getItem(
  db: DB,
  userId: string,
  itemId: number,
): Promise<ItemWithSource | null> {
  const { rawPayload: _rawPayload, ...itemColumns } =
    getTableColumns(feedItems);

  const [result] = await db
    .select({
      item: itemColumns,
      feed: feeds,
      readAt: userItemStates.readAt,
      bookmarkedAt: userItemStates.bookmarkedAt,
      globalWatermark: userPreferences.markedAllReadAt,
      categoryWatermark: categories.markedAllReadAt,
      subscriptionWatermark: subscriptions.markedAllReadAt,
      categoryName: categories.name,
      categoryColor: categories.color,
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

  const isRead = calculateIsRead({
    readAt: result.readAt,
    itemTimestamp: result.item.createdAt,
    publishedAt: result.item.publishedAt,
    globalWatermark: result.globalWatermark,
    categoryWatermark: result.categoryWatermark,
    subscriptionWatermark: result.subscriptionWatermark,
  });

  const isWatermarked = calculateIsRead({
    readAt: null,
    itemTimestamp: result.item.createdAt,
    publishedAt: result.item.publishedAt,
    globalWatermark: result.globalWatermark,
    categoryWatermark: result.categoryWatermark,
    subscriptionWatermark: result.subscriptionWatermark,
  });

  return {
    item: result.item,
    feed: result.feed,
    isRead,
    isBookmarked: !!result.bookmarkedAt,
    bookmarkedAt: result.bookmarkedAt,
    isExcerpt: isExcerpt(result.item),
    categoryName: result.categoryName,
    categoryColor: result.categoryColor,
    isWatermarked,
  };
}
