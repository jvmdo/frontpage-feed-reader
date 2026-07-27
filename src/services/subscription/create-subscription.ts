import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { FeedUnavailableError } from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import { normalizeUrl } from "@/lib/utils";
import {
  type FetchFeedResult,
  fetchFeedXml,
} from "@/services/ingestion/fetch-feed-xml";

/**
 * Create a feed subscription for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose subscriptions to create.
 * @param url - The URL of the feed to subscribe to.
 * @param categoryId - Optional ID of the category to assign the subscription to.
 */
export async function createSubscription(
  db: DB,
  userId: string,
  url: string,
  categoryId?: number | null,
) {
  const normalizedUrl = normalizeUrl(url);
  let resolvedUrl = normalizedUrl;

  // 1. Check if feed exists by normalized input URL
  let feed = await db.query.feeds.findFirst({
    where: eq(feeds.url, normalizedUrl),
  });

  // 2. If it doesn't exist, fetch and parse
  let metadata = null;
  let initialData: FetchFeedResult | undefined;

  if (!feed) {
    const fetchResult = await fetchFeedXml(normalizedUrl);

    // If we get a 304 (not_modified) for a new feed we don't have ETags for yet,
    // it's an unexpected state or server misconfiguration.
    if (fetchResult.status !== "success") {
      throw new FeedUnavailableError();
    }

    initialData = fetchResult;
    resolvedUrl = normalizeUrl(fetchResult.finalUrl);

    // Double check if the feed exists by final redirected URL
    const existingFeedByFinalUrl = await db.query.feeds.findFirst({
      where: eq(feeds.url, resolvedUrl),
    });

    if (existingFeedByFinalUrl) {
      feed = existingFeedByFinalUrl;
    } else {
      const parsed = await parseFeedXml(fetchResult.xml, resolvedUrl, {
        metadataOnly: true,
      });
      metadata = parsed.metadata;
    }
  }

  const result = await db.transaction(async (tx) => {
    // 3. Resolve feed inside transaction (handles race conditions)
    if (!feed && metadata) {
      const [newFeed] = await tx
        .insert(feeds)
        .values({
          url: resolvedUrl,
          title: metadata.title,
          description: metadata.description,
          iconUrl: metadata.iconUrl,
          healthStatus: "healthy",
          // We don't set ETags here to ensure ingestItems performs the first full sync
        })
        .onConflictDoNothing()
        .returning();

      if (!newFeed) {
        // Find the feed that was created by a concurrent request
        const existingFeed = await tx.query.feeds.findFirst({
          where: eq(feeds.url, resolvedUrl),
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
        categoryId,
      })
      .returning();

    return { subscription, feed };
  });

  return { ...result, initialData };
}
