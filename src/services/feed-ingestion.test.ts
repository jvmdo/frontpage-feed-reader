import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { feedItems, feeds } from "@/db/schema";
import { FeedNotFoundError, FeedRecordNotFoundError } from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { test } from "@/tests/test-extend";
import { ingestFeedItems } from "./feed-ingestion";

describe("ingestFeedItems integration", () => {
  const fixturesPath = path.join(process.cwd(), "e2e/fixtures");
  const RSS_CONTENT = fs.readFileSync(
    path.join(fixturesPath, "rss-2.xml"),
    "utf-8",
  );
  const RSS_NAMESPACES_CONTENT = fs.readFileSync(
    path.join(fixturesPath, "rss-namespaces.xml"),
    "utf-8",
  );
  const ATOM_CONTENT = fs.readFileSync(
    path.join(fixturesPath, "atom-1.xml"),
    "utf-8",
  );

  const FEED_URL = "https://example.com/feed.xml";

  test("successfully fetches, parses, and upserts RSS 2.0 feed items", async ({
    tx,
  }) => {
    const [insertedFeed] = await tx
      .insert(feeds)
      .values({
        url: FEED_URL,
        healthStatus: "unknown",
      })
      .returning();

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    const result = await ingestFeedItems(tx, insertedFeed.id);
    expect(result.success).toBe(true);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.title).toBe("Standard RSS 2.0 Feed");
    expect(updatedFeed.healthStatus).toBe("healthy");

    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, insertedFeed.id));

    expect(items.length).toBe(5);
    expect(items).toContainEqual(
      expect.objectContaining({
        guid: "https://css-tricks.com/?p=392986",
        title: "Making Complex CSS Shapes Using shape()",
      }),
    );
  });

  test("successfully fetches, parses, and upserts RSS Namespaces feed items", async ({
    tx,
  }) => {
    const [insertedFeed] = await tx
      .insert(feeds)
      .values({
        url: FEED_URL,
        healthStatus: "unknown",
      })
      .returning();

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_NAMESPACES_CONTENT);
      }),
    );

    const result = await ingestFeedItems(tx, insertedFeed.id);
    expect(result.success).toBe(true);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.title).toBe("Namespace Extended Feed");
    expect(updatedFeed.healthStatus).toBe("healthy");

    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, insertedFeed.id));

    expect(items.length).toBe(5);
    expect(items).toContainEqual(
      expect.objectContaining({
        guid: "https://medium.com/p/7799188344dc",
        title: "Context matters… A lot",
      }),
    );
  });

  test("successfully fetches, parses, and upserts Atom 1.0 feed items", async ({
    tx,
  }) => {
    const [insertedFeed] = await tx
      .insert(feeds)
      .values({
        url: FEED_URL,
        healthStatus: "unknown",
      })
      .returning();

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(ATOM_CONTENT);
      }),
    );

    const result = await ingestFeedItems(tx, insertedFeed.id);
    expect(result.success).toBe(true);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.title).toBe("Standard Atom 1.0 Feed");

    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, insertedFeed.id));

    expect(items.length).toBeGreaterThan(0);
    expect(items).toContainEqual(
      expect.objectContaining({
        guid: "https://vercel.com/blog/optimizing-vercel-sandbox-snapshots",
        title: "Optimizing Vercel Sandbox snapshots",
      }),
    );
  });

  test("handles updates for existing items (upsert)", async ({ tx }) => {
    const [insertedFeed] = await tx
      .insert(feeds)
      .values({ url: FEED_URL })
      .returning();

    // Insert an initial version of an item from rss-2.xml
    await tx.insert(feedItems).values({
      feedId: insertedFeed.id,
      guid: "https://css-tricks.com/?p=392986",
      title: "Old Title",
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    await ingestFeedItems(tx, insertedFeed.id);

    const [updatedItem] = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.guid, "https://css-tricks.com/?p=392986"));

    expect(updatedItem.title).toBe("Making Complex CSS Shapes Using shape()");
  });

  test("updates health_status to error on failure", async ({ tx }) => {
    const [insertedFeed] = await tx
      .insert(feeds)
      .values({
        url: FEED_URL,
        healthStatus: "healthy",
      })
      .returning();

    server.use(
      http.get(FEED_URL, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await expect(ingestFeedItems(tx, insertedFeed.id)).rejects.toThrow(
      FeedNotFoundError,
    );

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.healthStatus).toBe("error");
    expect(updatedFeed.lastFailureAt).toBeInstanceOf(Date);
  });

  test("handles non existing feed in db", async ({ tx }) => {
    await expect(ingestFeedItems(tx, 123)).rejects.toThrow(
      FeedRecordNotFoundError,
    );
  });
});
