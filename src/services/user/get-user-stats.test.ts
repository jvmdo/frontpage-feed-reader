import { describe, expect } from "vitest";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
  seedUser,
  seedUserItemState,
} from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getUserStats } from "./get-user-stats";

describe("getUserStats", () => {
  test("returns all zeros for a new user with no data", async ({
    tx,
    testUser,
  }) => {
    const stats = await getUserStats(tx, testUser.id);
    expect(stats).toEqual({
      subscriptions: 0,
      categories: 0,
      readArticles: 0,
      bookmarkedArticles: 0,
    });
  });

  test("correctly counts subscriptions, categories, read articles, and bookmarks", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    // Seed a category
    await seedCategory(tx, { userId: testUser.id, name: "Tech" });

    // Seed two subscriptions (feeds)
    const { feed: feed1 } = await seedFeedWithSubscription(tx, testUser.id);
    const { feed: feed2 } = await seedFeedWithSubscription(tx, testUser.id);

    // Seed some items for feed 1
    const [item1] = await seedItems(tx, feed1.id, [
      { title: "Item 1" },
      { title: "Item A" },
    ]);

    // Seed an item for feed 2
    const [item2] = await seedItems(tx, feed2.id, [{ title: "Item 2" }]);

    // Set state for item1 (read and bookmarked)
    await seedUserItemState(tx, {
      userId: testUser.id,
      itemId: item1.id,
      readAt: new Date(),
      bookmarkedAt: new Date(),
    });

    // 5. Set state for item2 (read only)
    await seedUserItemState(tx, {
      userId: testUser.id,
      itemId: item2.id,
      readAt: new Date(),
    });

    // Act
    const stats = await getUserStats(tx, testUser.id);

    // Assert
    expect(stats).toEqual({
      subscriptions: 2,
      categories: 1,
      readArticles: 2,
      bookmarkedArticles: 1,
    });
  });

  test("does not count other users' data", async ({ tx, testUser }) => {
    // Arrange
    // Create other user
    const otherUser = await seedUser(tx);

    // Seed other user data
    await seedCategory(tx, { userId: otherUser.id, name: "Other Tech" });
    const { feed: otherFeed } = await seedFeedWithSubscription(
      tx,
      otherUser.id,
    );
    const [otherItem] = await seedItems(tx, otherFeed.id, [
      { title: "Other Item" },
    ]);
    await seedUserItemState(tx, {
      userId: otherUser.id,
      itemId: otherItem.id,
      readAt: new Date(),
      bookmarkedAt: new Date(),
    });

    // Act
    const stats = await getUserStats(tx, testUser.id);

    // Assert test user  still have 0 stats
    expect(stats).toEqual({
      subscriptions: 0,
      categories: 0,
      readArticles: 0,
      bookmarkedArticles: 0,
    });
  });
});
