import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { parseFeedXml } from "@/lib/feed/parser";
import { fetchFeedXml } from "@/services/ingestion/fetch-feed-xml";

/**
 * Create a feed subscription for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose subscriptions to create.
 */
export async function createSubscription(db: DB, userId: string, url: string) {
  // 1. Check if feed exists (outside transaction)
  let feed = await db.query.feeds.findFirst({
    where: eq(feeds.url, url),
  });

  // 2. If it doesn't exist, fetch and parse (outside transaction)
  let metadata = null;
  if (!feed) {
    const xml = await fetchFeedXml(url);
    const parsed = await parseFeedXml(xml, url);
    metadata = parsed.metadata;
  }

  return await db.transaction(async (tx) => {
    // 3. Resolve feed inside transaction (handles race conditions)
    if (!feed && metadata) {
      const [newFeed] = await tx
        .insert(feeds)
        .values({
          url,
          title: metadata.title,
          description: metadata.description,
          iconUrl: metadata.iconUrl,
          healthStatus: "healthy",
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!newFeed) {
        // Find the feed that was created by a concurrent request
        const existingFeed = await tx.query.feeds.findFirst({
          where: eq(feeds.url, url),
        });
        if (!existingFeed) {
          throw new Error("Failed to resolve feed after conflict");
        }
        feed = existingFeed;
      } else {
        feed = newFeed;
      }
    }

    if (!feed) {
      throw new Error("Feed could not be resolved");
    }

    // 4. Check if subscription already exists
    const existingSubscription = await tx.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, feed.id),
      ),
    });

    if (existingSubscription) {
      return { subscription: existingSubscription, feed };
    }

    // 5. Create subscription
    const [subscription] = await tx
      .insert(subscriptions)
      .values({
        userId,
        feedId: feed.id,
      })
      .returning();

    return { subscription, feed };
  });
}
