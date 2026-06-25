import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { FeedUnavailableError } from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import { normalizeUrl } from "@/lib/utils";
import { fetchFeedXml } from "@/services/ingestion/fetch-feed-xml";

/**
 * Verify a feed URL (read-only verification to check metadata and subscription status).
 *
 * @param db - Drizzle database instance.
 * @param userId - ID of the user requesting verification.
 * @param url - The URL to verify.
 */
export async function verifyFeed(db: DB, userId: string, url: string) {
  const normalizedUrl = normalizeUrl(url);

  // 1. Check if feed already exists in the database
  const existingFeed = await db.query.feeds.findFirst({
    where: eq(feeds.url, normalizedUrl),
  });

  if (existingFeed) {
    // Check if user is already subscribed to this feed
    const userSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, existingFeed.id),
      ),
    });

    return {
      alreadySubscribed: !!userSub,
      feed: {
        title: existingFeed.title ?? "Untitled Feed",
        description: existingFeed.description ?? "",
        iconUrl: existingFeed.iconUrl,
      },
    };
  }

  // 2. Fetch and parse the feed XML (read-only verification)
  const fetchResult = await fetchFeedXml(normalizedUrl);

  if (fetchResult.status !== "success") {
    throw new FeedUnavailableError();
  }

  const resolvedUrl = normalizeUrl(fetchResult.finalUrl);

  // Double check if the feed exists by final redirected URL
  const existingFeedByFinalUrl = await db.query.feeds.findFirst({
    where: eq(feeds.url, resolvedUrl),
  });

  if (existingFeedByFinalUrl) {
    const userSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, existingFeedByFinalUrl.id),
      ),
    });

    return {
      alreadySubscribed: !!userSub,
      feed: {
        title: existingFeedByFinalUrl.title ?? "Untitled Feed",
        description: existingFeedByFinalUrl.description ?? "",
        iconUrl: existingFeedByFinalUrl.iconUrl,
      },
    };
  }

  const parsed = await parseFeedXml(fetchResult.xml, resolvedUrl);
  const { metadata } = parsed;

  return {
    alreadySubscribed: false,
    feed: {
      title: metadata.title,
      description: metadata.description,
      iconUrl: metadata.iconUrl ?? null,
    },
  };
}
