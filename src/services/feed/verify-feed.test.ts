import { HttpResponse, http } from "msw";
import {
  FeedInvalidFormatError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { preprocessUrlInput } from "@/lib/url";
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

  test("resolves combinations of protocol, subdomain, trailing slash, and bare domain variations to the canonical subscription", async ({
    tx,
    testUser,
  }) => {
    const canonicalUrl = "https://css-tricks.com/feed";
    const feedTitle = "CSS-Tricks Feed";

    // 1. Seed the database with the canonical feed and subscription
    await seedFeedWithSubscription(tx, testUser.id, {
      url: canonicalUrl,
      title: feedTitle,
    });

    const feedXml = `
      <rss version="2.0">
        <channel>
          <title>${feedTitle}</title>
          <link>https://css-tricks.com</link>
          <description>Tips, Tricks, and Techniques</description>
        </channel>
      </rss>
    `;

    // 2. Mock network redirects for all variants to the canonical URL
    const variations = [
      "https://www.css-tricks.com/feed",
      "https://www.css-tricks.com/feed/",
      "www.css-tricks.com/feed/",
      "www.css-tricks.com/feed",
      "https://css-tricks.com/feed",
      "https://css-tricks.com/feed/",
      "css-tricks.com/feed/",
      "css-tricks.com/feed",
    ];

    server.use(
      // The canonical URL returns the RSS feed content
      http.get(canonicalUrl, () => {
        return new HttpResponse(feedXml, {
          headers: { "Content-Type": "application/rss+xml" },
        });
      }),
      // Other HTTPS/HTTP variants redirect to the canonical URL
      http.get("https://www.css-tricks.com/feed", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("https://www.css-tricks.com/feed/", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("https://css-tricks.com/feed/", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("http://css-tricks.com/feed", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("http://css-tricks.com/feed/", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("http://www.css-tricks.com/feed", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
      http.get("http://www.css-tricks.com/feed/", () =>
        HttpResponse.redirect(canonicalUrl, 301),
      ),
    );

    // 3. Verify all 8 inputs resolve to the canonical subscription
    for (const input of variations) {
      const preprocessed = preprocessUrlInput(input);
      const result = await verifyFeed(tx, testUser.id, preprocessed);

      expect(result.alreadySubscribed).toBe(true);
      expect(result.feed.title).toBe(feedTitle);
    }
  });
});
