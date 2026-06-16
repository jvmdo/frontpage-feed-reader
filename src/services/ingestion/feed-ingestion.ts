import { eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { env } from "@/env";
import { FeedRecordNotFoundError } from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import {
  type FetchFeedResult,
  fetchFeedXml,
} from "@/services/ingestion/fetch-feed-xml";

export interface IngestItemsOptions {
  initialData?: Extract<FetchFeedResult, { status: "success" }>;
}

/**
 * Orchestrates fetching, parsing, and storing items for a single feed.
 */
export async function ingestItems(
  db: DB,
  feedId: number,
  options: IngestItemsOptions = {},
) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));

  if (!feed) {
    throw new FeedRecordNotFoundError(`Feed with ID ${feedId} not found`);
  }

  // 1. Check for throttling (Global Cooldown)
  // Skip if fetched recently, unless we have data handoff (initialData)
  const isRecentlyFetched =
    feed.lastFetchedAt &&
    Date.now() - feed.lastFetchedAt.getTime() < env.FEED_THROTTLE_MS;

  if (isRecentlyFetched && !options.initialData) {
    return { success: true, status: "throttled" };
  }

  try {
    let fetchResult: FetchFeedResult;

    if (options.initialData) {
      // Use the provided initial data (handoff from createSubscription)
      fetchResult = options.initialData;
    } else {
      // Standard fetch from the internet
      fetchResult = await fetchFeedXml(feed.url, {
        etag: feed.httpEtag,
        lastModified: feed.httpLastModified,
      });
    }

    if (fetchResult.status === "not_modified") {
      await db
        .update(feeds)
        .set({
          healthStatus: "healthy",
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
        })
        .where(eq(feeds.id, feedId));

      return { success: true, status: "not_modified" };
    }

    const { metadata, items } = await parseFeedXml(fetchResult.xml, feed.url);

    // Validate the icon URL if it is new/changed
    let validatedIconUrl: string | null = null;
    if (metadata.iconUrl) {
      if (metadata.iconUrl === feed.iconUrl) {
        validatedIconUrl = feed.iconUrl;
      } else {
        const isValid = await validateIconUrl(metadata.iconUrl);
        validatedIconUrl = isValid ? metadata.iconUrl : null;
      }
    }

    // 1. Upsert items
    if (items.length > 0) {
      await db
        .insert(feedItems)
        .values(
          items.map((item) => ({
            feedId,
            guid: item.guid,
            url: item.url,
            title: item.title,
            description: item.description,
            content: item.content,
            author: item.author,
            publishedAt: item.publishedAt,
            updatedAt: item.updatedAt,
            textContent: item.textContent,
            rawPayload: item.rawPayload,
          })),
        )
        .onConflictDoUpdate({
          target: [feedItems.feedId, feedItems.guid],
          set: {
            url: sql`excluded.${sql.raw(feedItems.url.name)}`,
            title: sql`excluded.${sql.raw(feedItems.title.name)}`,
            description: sql`excluded.${sql.raw(feedItems.description.name)}`,
            content: sql`excluded.${sql.raw(feedItems.content.name)}`,
            author: sql`excluded.${sql.raw(feedItems.author.name)}`,
            publishedAt: sql`excluded.${sql.raw(feedItems.publishedAt.name)}`,
            updatedAt: sql`excluded.${sql.raw(feedItems.updatedAt.name)}`,
            textContent: sql`excluded.${sql.raw(feedItems.textContent.name)}`,
            rawPayload: sql`excluded.${sql.raw(feedItems.rawPayload.name)}`,
          },
        });
    }

    // 2. Update feed status to healthy and save caching headers
    await db
      .update(feeds)
      .set({
        title: metadata.title,
        description: metadata.description,
        iconUrl: validatedIconUrl,
        healthStatus: "healthy",
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
        httpEtag: fetchResult.etag,
        httpLastModified: fetchResult.lastModified,
      })
      .where(eq(feeds.id, feedId));

    return { success: true, status: "fetched" };
  } catch (error) {
    // 3. Update feed status to error
    await db
      .update(feeds)
      .set({
        healthStatus: "error",
        lastFetchedAt: new Date(),
        lastFailureAt: new Date(),
      })
      .where(eq(feeds.id, feedId));

    throw error;
  }
}

/**
 * Validates if an icon URL is working by performing a HEAD or GET fetch.
 * Returns true if the URL is accessible and returns a success status.
 */
async function validateIconUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      // Short timeout to avoid blocking ingestion
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) return true;

    // Fallback to GET if HEAD is not allowed/supported by the hosting server
    if (response.status === 405 || response.status === 403) {
      const getResponse = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      return getResponse.ok;
    }

    return false;
  } catch {
    return false;
  }
}
