import { eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { seedFeedWithSubscription, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { deleteSubscription } from "./delete-subscription";

describe("deleteSubscription", () => {
  test("deletes the subscription successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const { subscription: sub } = await seedFeedWithSubscription(
      tx,
      testUser.id,
    );

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
    const otherUser = await seedUser(tx);

    // 2. Create a feed and subscription for the other user
    const { subscription: sub } = await seedFeedWithSubscription(
      tx,
      otherUser.id,
    );

    // 3. Attempt to delete as the test user
    await expect(deleteSubscription(tx, testUser.id, sub.id)).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });
});
