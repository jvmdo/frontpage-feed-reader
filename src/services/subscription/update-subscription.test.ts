import { eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { seedFeedWithSubscription, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { updateSubscription } from "./update-subscription";

describe("updateSubscription", () => {
  test("updates the custom title successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const { subscription: sub } = await seedFeedWithSubscription(tx, testUser.id);

    // 2. Update
    const updated = await updateSubscription(tx, testUser.id, sub.id, {
      customTitle: "New Title",
    });

    // 3. Verify
    expect(updated.customTitle).toBe("New Title");

    const [dbSub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, sub.id));
    expect(dbSub.customTitle).toBe("New Title");
  });

  test("throws SubscriptionNotFoundError if the subscription belongs to another user", async ({
    tx,
    testUser,
  }) => {
    // 1. Create another user
    const otherUser = await seedUser(tx);

    // 2. Create a feed and subscription for the other user
    const { subscription: sub } = await seedFeedWithSubscription(tx, otherUser.id);

    // 3. Attempt to update as the test user
    await expect(
      updateSubscription(tx, testUser.id, sub.id, { customTitle: "Sneaky" }),
    ).rejects.toThrow(SubscriptionNotFoundError);
  });
});
