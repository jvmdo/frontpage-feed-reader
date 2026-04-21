import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { markItemAsRead } from "./mark-item-as-read";

describe("markItemAsRead", () => {
  test("creates a read state for an item", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedFeedItems(tx, feed.id, [{ title: "Item 1" }]);

    const result = await markItemAsRead(tx, testUser.id, item.id);

    expect(result.userId).toBe(testUser.id);
    expect(result.itemId).toBe(item.id);
    expect(result.readAt).toBeInstanceOf(Date);
  });

  test("updates existing read state (upsert)", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedFeedItems(tx, feed.id, [{ title: "Item 1" }]);

    const firstResult = await markItemAsRead(tx, testUser.id, item.id);
    const firstReadAt = firstResult.readAt;

    // Small delay to ensure timestamp would be different if updated
    await new Promise((resolve) => setTimeout(resolve, 10));

    const secondResult = await markItemAsRead(tx, testUser.id, item.id);

    expect(secondResult.userId).toBe(testUser.id);
    expect(secondResult.itemId).toBe(item.id);
    expect(secondResult.readAt?.getTime()).toBeGreaterThan(firstReadAt?.getTime() ?? 0);
  });
});
