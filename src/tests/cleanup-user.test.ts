import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { categories, feedItems, feeds, subscriptions, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cleanupUser } from "./cleanup-user";

describe("cleanupUser", () => {
  const testUserId = "test-cleanup-user-id";
  const otherUserId = "other-user-id";

  beforeEach(async () => {
    // Clean start
    const { test: authTest } = await auth.$context;
    try {
      await authTest.deleteUser(testUserId);
      await authTest.deleteUser(otherUserId);
    } catch {}

    await db
      .delete(feeds)
      .where(eq(feeds.url, `https://example.com/feed?tenant=${testUserId}`));
    await db
      .delete(feeds)
      .where(eq(feeds.url, "https://example.com/other-feed"));
  });

  it("should remove the user and all their cascaded data", async () => {
    const { test: authTest } = await auth.$context;

    // 1. Setup: Create a user and some data
    await authTest.saveUser(
      authTest.createUser({
        id: testUserId,
        email: "cleanup@example.com",
        name: "Cleanup Test User",
      }),
    );

    const [category] = await db
      .insert(categories)
      .values({
        userId: testUserId,
        name: "Cleanup Category",
      })
      .returning();

    const [feed] = await db
      .insert(feeds)
      .values({
        url: `https://example.com/feed?tenant=${testUserId}`,
        title: "Cleanup Feed",
      })
      .returning();

    await db.insert(subscriptions).values({
      userId: testUserId,
      feedId: feed.id,
      categoryId: category.id,
    });

    await db.insert(feedItems).values({
      feedId: feed.id,
      guid: "cleanup-guid",
      title: "Cleanup Item",
    });

    // 2. Setup: Create another user (should remain untouched)
    await authTest.saveUser(
      authTest.createUser({
        id: otherUserId,
        email: "other@example.com",
        name: "Other User",
      }),
    );

    // 3. Execution: Run cleanup
    await cleanupUser(testUserId);

    // 4. Verification: Test user data should be gone
    const users = await db.select().from(user).where(eq(user.id, testUserId));
    expect(users).toHaveLength(0);

    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, testUserId));
    expect(cats).toHaveLength(0);

    const fds = await db
      .select()
      .from(feeds)
      .where(eq(feeds.url, `https://example.com/feed?tenant=${testUserId}`));
    expect(fds).toHaveLength(0);

    // Check if feed items were cascaded
    const items = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, feed.id));
    expect(items).toHaveLength(0);

    // 5. Verification: Other user should still exist
    const otherUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, otherUserId));
    expect(otherUsers).toHaveLength(1);
  });

  it("should handle cases where the user does not exist", async () => {
    // Should not throw
    await expect(cleanupUser("non-existent-id")).resolves.not.toThrow();
  });
});
