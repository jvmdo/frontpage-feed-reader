import { eq } from "drizzle-orm";
import { feeds, subscriptions, user } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { test } from "@/tests/test-extend";
import { deleteSubscription } from "./delete-subscription";

describe("deleteSubscription", () => {
  test("deletes the subscription successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: testUser.id, feedId: feed.id })
      .returning();

    // 2. Delete
    const deleted = await deleteSubscription(tx, testUser.id, sub.id);

    // 3. Verify
    expect(deleted.id).toBe(sub.id);

    const [dbSub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, sub.id));
    expect(dbSub).toBeUndefined();
  });

  test("throws SubscriptionNotFoundError if attempting to delete another user's subscription", async ({
    tx,
    testUser,
  }) => {
    // 1. Create another user
    const otherUserId = "other_user_id";
    await tx.insert(user).values({
      id: otherUserId,
      email: "other@example.com",
      name: "Other User",
    });

    // 2. Create a feed and subscription for the other user
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: otherUserId, feedId: feed.id })
      .returning();

    // 3. Attempt to delete as the test user
    await expect(deleteSubscription(tx, testUser.id, sub.id)).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });
});
