import { HttpResponse, http } from "msw";
import {
  FeedInvalidFormatError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { seedFeed, seedFeedWithSubscription } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { verifyFeed } from "./verify-feed";

describe("verifyFeed service", () => {
  test("returns alreadySubscribed: true if feed exists in DB and user is subscribed", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    const result = await verifyFeed(tx, testUser.id, feed.url);

    expect(result).toEqual(
      expect.objectContaining({ alreadySubscribed: true }),
    );
  });

  test("returns alreadySubscribed: false if feed exists in DB but user is NOT subscribed", async ({
    tx,
    testUser,
  }) => {
    const { url } = await seedFeed(tx);

    const result = await verifyFeed(tx, testUser.id, url);

    expect(result).toEqual(
      expect.objectContaining({
        alreadySubscribed: false,
      }),
    );
  });

  test("fetches, parses, and returns metadata if feed is NOT in DB", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/new-feed.xml";
    server.use(
      http.get(url, () => {
        return HttpResponse.xml(`
          <rss version="2.0">
            <channel>
              <title>New Fetched Feed</title>
              <link>https://example.com</link>
              <description>New Description</description>
            </channel>
          </rss>
        `);
      }),
    );

    const result = await verifyFeed(tx, testUser.id, url);

    expect(result).toEqual({
      alreadySubscribed: false,
      feed: {
        title: "New Fetched Feed",
        description: "New Description",
        iconUrl: "https://www.google.com/s2/favicons?domain=example.com&sz=64",
      },
    });
  });

  test("normalizes URLs and prevents duplicates (trailing slash)", async ({
    tx,
    testUser,
  }) => {
    const urlWithoutSlash = "https://example.com/feed.xml";
    const urlWithSlash = "https://example.com/feed.xml/";

    // 1. Seed feed with URL without trailing slash
    await seedFeedWithSubscription(tx, testUser.id, {
      url: urlWithoutSlash,
      title: "Clean Url Feed",
    });

    // 2. Verify URL with slash resolves to the clean URL feed record
    const result = await verifyFeed(tx, testUser.id, urlWithSlash);

    expect(result.alreadySubscribed).toBe(true);
    expect(result.feed.title).toBe("Clean Url Feed");
  });

  test("throws FeedNotFoundError when server returns 404", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/404.xml";
    server.use(
      http.get(url, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await expect(verifyFeed(tx, testUser.id, url)).rejects.toThrow(
      FeedNotFoundError,
    );
  });

  test("throws FeedUnavailableError when server returns 500", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/500.xml";
    server.use(
      http.get(url, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(verifyFeed(tx, testUser.id, url)).rejects.toThrow(
      FeedUnavailableError,
    );
  });

  test("throws FeedInvalidFormatError when content is not valid XML", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/invalid.xml";
    server.use(
      http.get(url, () => {
        return HttpResponse.text("Not a feed");
      }),
    );

    await expect(verifyFeed(tx, testUser.id, url)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });
});
