import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { parseFeedXml } from "@/lib/feed/parser";
import { fetchFeedXml } from "@/services/fetch-feed-xml";

/**
 * Create a feed subscription for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose subscriptions to create.
 */
export async function addFeedToUser(db: DB, userId: string, url: string) {
  return await db.transaction(async (tx) => {
    // 1. Check if feed exists, or fetch and create it
    let feed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, url),
    });

    if (!feed) {
      const xml = await fetchFeedXml(url);
      const { metadata } = await parseFeedXml(xml, url);

      const [newFeed] = await tx
        .insert(feeds)
        .values({
          url,
          title: metadata.title,
          description: metadata.description,
          healthStatus: "healthy",
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
        })
        .onConflictDoNothing() // Don't throw on race conditions
        .returning();

      // Find the feed that couldn't be returned due to a conflict
      const existingFeed = await tx.query.feeds.findFirst({
        where: eq(feeds.url, url),
      });

      feed = newFeed ?? existingFeed;
    }

    // 2. Check if subscription already exists
    const existingSubscription = await tx.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, feed.id),
      ),
    });

    if (existingSubscription) {
      return { subscription: existingSubscription, feed };
    }

    // 3. Create subscription
    const [subscription] = await tx
      .insert(subscriptions)
      .values({
        userId,
        feedId: feed.id,
      })
      .returning();

    return { subscription, feed: feed };
  });
}
