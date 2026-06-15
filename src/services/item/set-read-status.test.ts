import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { setReadStatus } from "./set-read-status";

describe("setReadStatus", () => {
  test("creates a read state for an item", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    const result = await setReadStatus(tx, testUser.id, item.id);

    expect(result.userId).toBe(testUser.id);
    expect(result.itemId).toBe(item.id);
    expect(result.readAt).toBeInstanceOf(Date);
  });

  test("updates existing read state (upsert)", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    const firstResult = await setReadStatus(tx, testUser.id, item.id);
    const firstReadAt = firstResult.readAt;

    // Small delay to ensure timestamp would be different if updated
    await new Promise((resolve) => setTimeout(resolve, 10));

    const secondResult = await setReadStatus(tx, testUser.id, item.id);

    expect(secondResult.userId).toBe(testUser.id);
    expect(secondResult.itemId).toBe(item.id);
    expect(secondResult.readAt?.getTime()).toBeGreaterThan(
      firstReadAt?.getTime() ?? 0,
    );
  });

  test("can mark an item as unread (readAt to null)", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const [item] = await seedItems(tx, feed.id, [{ title: "Item 1" }]);

    // Mark as read first
    await setReadStatus(tx, testUser.id, item.id, true);

    // Now mark as unread
    const result = await setReadStatus(tx, testUser.id, item.id, false);

    expect(result.userId).toBe(testUser.id);
    expect(result.itemId).toBe(item.id);
    expect(result.readAt).toBeNull();
  });
});
