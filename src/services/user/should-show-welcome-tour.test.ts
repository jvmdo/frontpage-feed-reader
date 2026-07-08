import * as schema from "@/db/schema";
import { test } from "@/tests/test-extend";
import { shouldShowWelcomeTour } from "./should-show-welcome-tour";

describe("shouldShowWelcomeTour", () => {
  test("returns true for anonymous users regardless of subscriptions", async ({
    tx,
    testUser,
  }) => {
    // 1. Act
    const result = await shouldShowWelcomeTour(tx, {
      userId: testUser.id,
      isAnonymous: true,
    });

    // 2. Assert
    expect(result).toBe(true);
  });

  test("returns true for authenticated users with no subscriptions", async ({
    tx,
    testUser,
  }) => {
    // 1. Act
    const result = await shouldShowWelcomeTour(tx, {
      userId: testUser.id,
      isAnonymous: false,
    });

    // 2. Assert
    expect(result).toBe(true);
  });

  test("returns false for authenticated users with subscriptions", async ({
    tx,
    testUser,
  }) => {
    // 1. Setup
    // Insert a feed
    const [feed] = await tx
      .insert(schema.feeds)
      .values({
        url: "https://example.com/feed.xml",
        title: "Test Feed",
      })
      .returning({ id: schema.feeds.id });

    // Insert a subscription for the testUser
    await tx.insert(schema.subscriptions).values({
      userId: testUser.id,
      feedId: feed.id,
    });

    // 2. Act
    const result = await shouldShowWelcomeTour(tx, {
      userId: testUser.id,
      isAnonymous: false,
    });

    // 3. Assert
    expect(result).toBe(false);
  });

  test("ignores subscriptions belonging to other users", async ({
    tx,
    testUser,
  }) => {
    // 1. Setup
    const otherUserId = "other-user-123";

    await tx.insert(schema.user).values({
      id: otherUserId,
      name: "Other User",
      email: "other@example.com",
    });

    const [feed] = await tx
      .insert(schema.feeds)
      .values({
        url: "https://example.com/feed2.xml",
        title: "Test Feed 2",
      })
      .returning({ id: schema.feeds.id });

    // Insert subscription for OTHER user
    await tx.insert(schema.subscriptions).values({
      userId: otherUserId,
      feedId: feed.id,
    });

    // 2. Act
    // testUser has NO subscriptions
    const result = await shouldShowWelcomeTour(tx, {
      userId: testUser.id,
      isAnonymous: false,
    });

    // 3. Assert
    expect(result).toBe(true);
  });
});
