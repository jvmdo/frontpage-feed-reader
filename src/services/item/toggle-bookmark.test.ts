import { userItemStates } from "@/db/schema";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { toggleBookmark } from "./toggle-bookmark";

describe("toggleBookmark", () => {
  test("bookmarks an item when not previously bookmarked", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    const result = await toggleBookmark(tx, testUser.id, item.id);

    expect(result.userId).toBe(testUser.id);
    expect(result.itemId).toBe(item.id);
    expect(result.bookmarkedAt).toBeInstanceOf(Date);
  });

  test("removes bookmark when already bookmarked", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    // First toggle to bookmark
    await toggleBookmark(tx, testUser.id, item.id);

    // Second toggle to remove bookmark
    const result = await toggleBookmark(tx, testUser.id, item.id);

    expect(result.userId).toBe(testUser.id);
    expect(result.itemId).toBe(item.id);
    expect(result.bookmarkedAt).toBeNull();
  });

  test("preserves read status when toggling bookmark", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    // Mark as read first
    const readAt = new Date();
    await tx
      .insert(userItemStates)
      .values({
        userId: testUser.id,
        itemId: item.id,
        readAt,
      })
      .onConflictDoUpdate({
        target: [userItemStates.userId, userItemStates.itemId],
        set: { readAt },
      });

    // Toggle bookmark
    const result = await toggleBookmark(tx, testUser.id, item.id);

    expect(result.bookmarkedAt).toBeInstanceOf(Date);
    expect(result.readAt?.getTime()).toBe(readAt.getTime());
  });
});
