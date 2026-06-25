import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { feedItems, feeds, subscriptions } from "@/db/schema";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { server } from "@/tests/mocks/server";
import { seedFeed } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { createSubscription } from "./create-subscription";

describe("createSubscription", () => {
  test("adds a new feed and subscription with initial fetch data", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // Act
    const { subscription, feed, initialData } = await createSubscription(
      tx,
      userId,
      url,
    );

    // Assert
    expect(subscription).toBeDefined();
    expect(subscription.userId).toBe(userId);

    expect(feed).toBeDefined();
    expect(feed.title).toBe("Example Feed");
    expect(subscription.feedId).toBe(feed.id);

    // Verify initialData is returned for new feed
    expect(initialData).toBeDefined();
    expect(initialData?.status).toBe("success");
    expect((initialData as any)?.xml).toContain("<title>Example Feed</title>");

    // Verify ETags are NOT saved yet
    expect(feed.httpEtag).toBeNull();
    expect(feed.httpLastModified).toBeNull();
  });

  test("reuses existing feed and returns no initialData", async ({
    tx,
    testUser,
  }) => {
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";
    const existingFeed = await seedFeed(tx, {
      url,
    });

    const { subscription, feed, initialData } = await createSubscription(
      tx,
      userId,
      url,
    );
    const allFeeds = await tx.select().from(feeds);

    expect(subscription.feedId).toBe(existingFeed.id);
    expect(feed.id).toBe(existingFeed.id);
    expect(allFeeds.length).toBe(1);
    expect(initialData).toBeUndefined(); // Should not fetch if feed exists
  });

  test("is idempotent for the same user and feed", async ({ tx, testUser }) => {
    // 1. Setup
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // 2. Execute twice
    const { subscription: sub1 } = await createSubscription(tx, userId, url);
    const { subscription: sub2 } = await createSubscription(tx, userId, url);
    const userSubs = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // 3. Verify
    expect(sub1.id).toBe(sub2.id);
    expect(userSubs.length).toBe(1);
  });

  test("normalizes URLs and prevents duplicates (trailing slash)", async ({
    tx,
    testUser,
  }) => {
    // 1. Setup
    const userId = testUser.id;
    const urlWithoutSlash = "https://example.com/feed.xml";
    const urlWithSlash = "https://example.com/feed.xml/";

    // 2. Subscribe to urlWithoutSlash
    const { feed: feed1, subscription: sub1 } = await createSubscription(
      tx,
      userId,
      urlWithoutSlash,
    );

    // 3. Subscribe to urlWithSlash
    const { feed: feed2, subscription: sub2 } = await createSubscription(
      tx,
      userId,
      urlWithSlash,
    );

    // 4. Verify they resolved to the exact same feed record
    expect(feed1.id).toBe(feed2.id);
    expect(feed1.url).toBe(urlWithoutSlash);
    expect(feed2.url).toBe(urlWithoutSlash);
    expect(sub1.id).toBe(sub2.id);

    const allFeeds = await tx.select().from(feeds);
    expect(allFeeds.length).toBe(1);
  });

  test("resolves redirects and prevents duplicates (e.g. www vs non-www)", async ({
    tx,
    testUser,
  }) => {
    const userId = testUser.id;
    const url1 = "https://example.com/feed.xml";
    const url2 = "https://www.example.com/feed.xml";

    const feedContent = `
      <rss version="2.0">
        <channel>
          <title>Redirect Test Feed</title>
          <link>https://example.com</link>
          <description>Description</description>
        </channel>
      </rss>
    `;

    // Simulate url1 redirecting to url2
    server.use(
      http.get(url1, () => {
        return HttpResponse.redirect(url2, 301);
      }),
      http.get(url2, () => {
        return new HttpResponse(feedContent, {
          headers: { "Content-Type": "application/rss+xml" },
        });
      }),
    );

    // 1. Subscribe using url1 (which redirects to url2)
    const { feed: feed1, subscription: sub1 } = await createSubscription(
      tx,
      userId,
      url1,
    );

    // 2. Subscribe directly using url2
    const { feed: feed2, subscription: sub2 } = await createSubscription(
      tx,
      userId,
      url2,
    );

    // 3. Verify both resolved to the same feed record (using url2 as the canonical one)
    expect(feed1.id).toBe(feed2.id);
    expect(feed1.url).toBe(url2);
    expect(feed2.url).toBe(url2);
    expect(sub1.id).toBe(sub2.id);

    const allFeeds = await tx.select().from(feeds);
    expect(allFeeds.length).toBe(1);
  });

  test("throws FeedNotFoundError when server returns 404", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/404.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 404 })));

    await expect(createSubscription(tx, testUser.id, url)).rejects.toThrow(
      FeedNotFoundError,
    );
  });

  test("throws FeedUnavailableError when server returns 500", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/500.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));

    await expect(createSubscription(tx, testUser.id, url)).rejects.toThrow(
      FeedUnavailableError,
    );
  });

  test("throws FeedInvalidFormatError when content is not valid XML", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/invalid.xml";
    server.use(http.get(url, () => HttpResponse.text("Not a feed")));

    await expect(createSubscription(tx, testUser.id, url)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });

  test("throws FeedUnavailableError when server returns 304 Not Modified (unexpected)", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/304.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 304 })));

    await expect(createSubscription(tx, testUser.id, url)).rejects.toThrow(
      FeedUnavailableError,
    );
  });

  test("throws FeedNetworkError when fetch fails", async ({ tx, testUser }) => {
    const url = "https://example.com/network-error.xml";
    server.use(http.get(url, () => HttpResponse.error()));

    await expect(createSubscription(tx, testUser.id, url)).rejects.toThrow(
      FeedNetworkError,
    );
  });

  test("Flow: correctly ingests items for a brand new feed using data handoff", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/brand-new-flow.xml";
    const fixturesPath = path.join(process.cwd(), "e2e/fixtures");
    const rssContent = fs.readFileSync(
      path.join(fixturesPath, "rss-2.xml"),
      "utf-8",
    );

    // 1. Setup mock
    server.use(
      http.get(url, () => {
        return new HttpResponse(rssContent, {
          headers: {
            "Content-Type": "application/rss+xml",
            ETag: "initial-etag",
          },
        });
      }),
    );

    // 2. Link User to Feed (Create)
    const { feed, initialData } = await createSubscription(
      tx,
      testUser.id,
      url,
    );

    // 3. Ingest items (Using handoff)
    // Note: We reset handlers to prove it doesn't fetch from network
    server.resetHandlers();

    const ingestResult = await ingestItems(tx, feed.id, {
      initialData: initialData?.status === "success" ? initialData : undefined,
    });

    // 4. Verify
    expect(ingestResult.success).toBe(true);
    expect(ingestResult.status).toBe("fetched");

    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, feed.id));

    expect(items.length).toBe(5);
    expect(items[0].title).toBe("Making Complex CSS Shapes Using shape()");

    const [updatedFeed] = await tx
      .select()
      .from(feeds)
      .where(eq(feeds.id, feed.id));
    expect(updatedFeed.httpEtag).toBe("initial-etag");
  });
});
