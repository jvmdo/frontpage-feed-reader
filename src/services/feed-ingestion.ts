import { eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { FeedRecordNotFoundError } from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import { fetchFeedXml } from "@/services/fetch-feed-xml";

/**
 * Orchestrates fetching, parsing, and storing items for a single feed.
 */
export async function ingestFeedItems(db: DB, feedId: number) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));

  if (!feed) {
    throw new FeedRecordNotFoundError(`Feed with ID ${feedId} not found`);
  }

  try {
    const xml = await fetchFeedXml(feed.url);
    const { metadata, items } = await parseFeedXml(xml, feed.url);

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
            rawPayload: sql`excluded.${sql.raw(feedItems.rawPayload.name)}`,
          },
        });
    }

    // 2. Update feed status to healthy
    await db
      .update(feeds)
      .set({
        title: metadata.title,
        description: metadata.description,
        healthStatus: "healthy",
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
      })
      .where(eq(feeds.id, feedId));

    return { success: true };
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
