import { and, desc, eq, getTableColumns } from "drizzle-orm";
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
import type { ListItemWithSource } from "@/types";

interface GetItemsOptions {
  limit?: number;
  offset?: number;
  feedId?: number;
  categoryId?: number;
}

/**
 * Retrieves a paginated list of feed items for a specific user,
 * joined with source information and user-specific read state.
 */
export async function getItems(
  db: DB,
  userId: string,
  options: GetItemsOptions,
): Promise<ListItemWithSource[]> {
  const { limit = 20, offset = 0, feedId, categoryId } = options;

  const {
    rawPayload: _rawPayload,
    content: _content,
    ...itemColumns
  } = getTableColumns(feedItems);

  const results = await db
    .select({
      item: itemColumns,
      feed: feeds,
      readAt: userItemStates.readAt,
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
    const itemTimestamp = row.item.createdAt;

    // Cascading watermark logic
    const watermarks = [
      row.globalWatermark,
      row.categoryWatermark,
      row.subscriptionWatermark,
    ].filter((w): w is Date => w !== null);

    const latestWatermark =
      watermarks.length > 0
        ? new Date(Math.max(...watermarks.map((w) => w.getTime())))
        : null;

    const isRead =
      !!row.readAt || (!!latestWatermark && itemTimestamp <= latestWatermark);

    return {
      item: row.item,
      feed: row.feed,
      isRead,
      isExcerpt: isExcerpt(row.item),
      categoryName: row.categoryName,
      categoryColor: row.categoryColor,
    };
  });
}
