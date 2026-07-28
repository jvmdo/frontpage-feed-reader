import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { feedItems, feeds } from "@/db/schema";
import { env } from "@/env";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { FeedNotFoundError, FeedRecordNotFoundError } from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { seedFeed, seedItems } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { ingestItems } from "./feed-ingestion";

describe("ingestItems integration", () => {
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
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    const result = await ingestItems(tx, insertedFeed.id);
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
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_NAMESPACES_CONTENT);
      }),
    );

    const result = await ingestItems(tx, insertedFeed.id);
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
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(ATOM_CONTENT);
      }),
    );

    const result = await ingestItems(tx, insertedFeed.id);
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
    const insertedFeed = await seedFeed(tx, { url: FEED_URL });

    // Insert an initial version of an item from rss-2.xml
    await seedItems(tx, insertedFeed.id, [
      {
        guid: "https://css-tricks.com/?p=392986",
      },
    ]);

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    await ingestItems(tx, insertedFeed.id);

    const [updatedItem] = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.guid, "https://css-tricks.com/?p=392986"));

    expect(updatedItem.title).toBe("Making Complex CSS Shapes Using shape()");
  });

  test("updates publishedAt for existing items if they were ingested within the 24-hour grace period", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, { url: FEED_URL });
    const originalDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    await seedItems(tx, insertedFeed.id, [
      {
        guid: "https://css-tricks.com/?p=392986",
        publishedAt: originalDate,
        createdAt: originalDate,
      },
    ]);

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    await ingestItems(tx, insertedFeed.id);

    const [updatedItem] = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.guid, "https://css-tricks.com/?p=392986"));

    // The RSS_CONTENT has pubDate: Tue, 09 Jan 2024 16:29:43 +0000
    // It should have overwritten originalDate because originalDate is within the 24h grace period
    expect(updatedItem.publishedAt?.getTime()).not.toBe(originalDate.getTime());
  });

  test("ignores publishedAt updates for existing items if they were ingested more than 24 hours ago", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, { url: FEED_URL });
    const originalDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    await seedItems(tx, insertedFeed.id, [
      {
        guid: "https://css-tricks.com/?p=392986",
        publishedAt: originalDate,
        createdAt: originalDate,
      },
    ]);

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    await ingestItems(tx, insertedFeed.id);

    const [updatedItem] = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.guid, "https://css-tricks.com/?p=392986"));

    // Because createdAt is 48h ago, the grace period has expired.
    // The publishedAt date from the RSS_CONTENT should be completely ignored.
    expect(updatedItem.publishedAt?.getTime()).toBe(originalDate.getTime());
  });

  test("always updates publishedAt for welcome feed items even if ingested more than 24 hours ago", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, { url: WELCOME_FEED_URL });
    const originalDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    await seedItems(tx, insertedFeed.id, [
      {
        guid: "https://frontpage.app/welcome",
        publishedAt: originalDate,
        createdAt: originalDate,
      },
    ]);

    await ingestItems(tx, insertedFeed.id);

    const [updatedItem] = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.guid, "https://frontpage.app/welcome"));

    // For the welcome feed, publishedAt should be updated to NOW even if createdAt is 48h ago
    expect(updatedItem.publishedAt?.getTime()).not.toBe(originalDate.getTime());
  });

  test("successfully processes feed items using initialData (handoff)", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    // We do NOT set up a mock server handler here.
    // If ingestItems tries to fetch, it will fail because there is no handler for FEED_URL.

    const result = await ingestItems(tx, insertedFeed.id, {
      initialData: {
        status: "success",
        xml: RSS_CONTENT,
        etag: "new-etag",
        lastModified: "new-modified",
        finalUrl: FEED_URL,
      },
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("fetched");

    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, insertedFeed.id));

    expect(items.length).toBe(5);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.httpEtag).toBe("new-etag");
    expect(updatedFeed.httpLastModified).toBe("new-modified");
  });

  test("throttles requests if called within the cooldown period", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
      lastFetchedAt: new Date(), // Just fetched now
    });

    const result = await ingestItems(tx, insertedFeed.id);

    expect(result.success).toBe(true);
    expect(result.status).toBe("throttled");
  });

  test("allows fetch after cooldown has expired", async ({ tx }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
      lastFetchedAt: new Date(Date.now() - env.FEED_THROTTLE_MS - 1000), // Expired
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
    );

    const result = await ingestItems(tx, insertedFeed.id);

    expect(result.success).toBe(true);
    expect(result.status).toBe("fetched");
  });

  test("updates health_status to error on failure", async ({ tx }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await expect(ingestItems(tx, insertedFeed.id)).rejects.toThrow(
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
    await expect(ingestItems(tx, 123)).rejects.toThrow(FeedRecordNotFoundError);
  });

  test("validates and saves iconUrl when validation succeeds", async ({
    tx,
  }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
      // Mock HEAD check for favicon to succeed (200)
      http.head("https://www.google.com/s2/favicons", () => {
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await ingestItems(tx, insertedFeed.id);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.iconUrl).toBe(
      "https://www.google.com/s2/favicons?domain=css-tricks.com&sz=64",
    );
  });

  test("sets iconUrl to null when validation fails", async ({ tx }) => {
    const insertedFeed = await seedFeed(tx, {
      url: FEED_URL,
    });

    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(RSS_CONTENT);
      }),
      // Mock HEAD check for favicon to fail (404)
      http.head("https://www.google.com/s2/favicons", () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await ingestItems(tx, insertedFeed.id);

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, insertedFeed.id));

    expect(updatedFeed.iconUrl).toBeNull();
  });
});
