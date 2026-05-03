import { describe, expect } from "vitest";
import { seedFeedWithSubscription, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getSubscriptionByFeedId } from "./get-subscription-by-feed-id";

describe("getSubscriptionByFeedId", () => {
  test("returns subscription joined with feed data by feed ID", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const { feed, subscription: sub } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {
        url: "https://example.com/rss",
      },
    );

    // Act
    const result = await getSubscriptionByFeedId(tx, testUser.id, feed.id);

    // Assert
    expect(result).toBeDefined();
    expect(result?.subscription.id).toBe(sub.id);
    expect(result?.feed.id).toBe(feed.id);
    expect(result?.feed.url).toBe("https://example.com/rss");
  });

  test("returns undefined if the subscription for that feed belongs to another user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    const { feed } = await seedFeedWithSubscription(
      tx,
      otherUser.id,
    );

    // Act
    const result = await getSubscriptionByFeedId(tx, testUser.id, feed.id);

    // Assert
    expect(result).toBeUndefined();
  });

  test("returns undefined if the feed exists but user is not subscribed", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    const { feed } = await seedFeedWithSubscription(tx, otherUser.id);

    // Act
    const result = await getSubscriptionByFeedId(tx, testUser.id, feed.id);

    // Assert
    expect(result).toBeUndefined();
  });

  test("returns undefined if the feed does not exist", async ({
    tx,
    testUser,
  }) => {
    // Act
    const result = await getSubscriptionByFeedId(tx, testUser.id, 9999);
    
    // Assert
    expect(result).toBeUndefined();
  });
});
