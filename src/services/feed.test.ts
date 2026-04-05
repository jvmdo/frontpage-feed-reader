import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { feeds, subscriptions } from "@/db/schema";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { test } from "@/tests/test-extend";
import { addFeedToUser } from "./feed";

describe("addFeedToUser", () => {
  test("adds a new feed and subscription", async ({ tx, testUser }) => {
    // Arrange
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // Act
    const subscription = await addFeedToUser(tx, userId, url);
    const feed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, url),
    });

    // Assert
    expect(subscription).toBeDefined();
    expect(subscription.userId).toBe(userId);

    expect(feed).toBeDefined();
    expect(feed?.title).toBe("Example Feed");
    expect(subscription.feedId).toBe(feed?.id);
  });

  test("reuses existing feed and creates subscription", async ({
    tx,
    testUser,
  }) => {
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";
    const [existingFeed] = await tx
      .insert(feeds)
      .values({
        url,
        title: "Old Title",
        healthStatus: "healthy",
      })
      .returning();

    const subscription = await addFeedToUser(tx, userId, url);
    const allFeeds = await tx.select().from(feeds);

    expect(subscription.feedId).toBe(existingFeed.id);
    expect(allFeeds.length).toBe(1); // Should not have inserted a new feed
  });

  test("is idempotent for the same user and feed", async ({ tx, testUser }) => {
    // 1. Setup
    const userId = testUser.id;
    const url = "https://example.com/feed.xml";

    // 2. Execute twice
    const sub1 = await addFeedToUser(tx, userId, url);
    const sub2 = await addFeedToUser(tx, userId, url);
    const userSubs = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // 3. Verify
    expect(sub1.id).toBe(sub2.id);
    expect(userSubs.length).toBe(1);
  });

  test("throws FeedNotFoundError when server returns 404", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/404.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 404 })));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedNotFoundError,
    );
  });

  test("throws FeedUnavailableError when server returns 500", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/500.xml";
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedUnavailableError,
    );
  });

  test("throws FeedInvalidFormatError when content is not valid XML", async ({
    tx,
    testUser,
  }) => {
    const url = "https://example.com/invalid.xml";
    server.use(http.get(url, () => HttpResponse.text("Not a feed")));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });

  test("throws FeedNetworkError when fetch fails", async ({ tx, testUser }) => {
    const url = "https://example.com/network-error.xml";
    server.use(http.get(url, () => HttpResponse.error()));

    await expect(addFeedToUser(tx, testUser.id, url)).rejects.toThrow(
      FeedNetworkError,
    );
  });
});
