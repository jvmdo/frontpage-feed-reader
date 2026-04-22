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
import type { FeedItemWithSource } from "@/types";

/**
 * Retrieves a single feed item with its associated feed metadata and read state.
 * Returns null if the item doesn't exist or the user is not subscribed to its feed.
 */
export async function getFeedItem(
  db: DB,
  userId: string,
  itemId: number,
): Promise<FeedItemWithSource | null> {
  const [result] = await db
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
    .leftJoin(userPreferences, eq(subscriptions.userId, userPreferences.userId))
    .leftJoin(
      userItemStates,
      and(
        eq(feedItems.id, userItemStates.itemId),
        eq(subscriptions.userId, userItemStates.userId),
      ),
    )
    .where(and(eq(feedItems.id, itemId), eq(subscriptions.userId, userId)))
    .limit(1);

  if (!result) {
    return null;
  }

  const publishedAt = result.item.publishedAt || result.item.createdAt;

  const isRead = !!(
    result.readAt ||
    (result.globalMarkedReadAt && publishedAt <= result.globalMarkedReadAt) ||
    (result.categoryMarkedReadAt &&
      publishedAt <= result.categoryMarkedReadAt) ||
    (result.subscriptionMarkedReadAt &&
      publishedAt <= result.subscriptionMarkedReadAt)
  );

  return {
    item: result.item,
    feed: result.feed,
    isRead,
  };
}
