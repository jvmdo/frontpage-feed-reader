import { eq } from "drizzle-orm";
import { feeds, subscriptions, user } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { test } from "@/tests/test-extend";
import { updateSubscription } from "./update-subscription";

describe("updateSubscription", () => {
  test("updates the custom title successfully", async ({ tx, testUser }) => {
    // 1. Create a feed and subscription
    const [feed] = await tx
      .insert(feeds)
      .values({ url: "https://a.com", title: "A" })
      .returning();
    const [sub] = await tx
      .insert(subscriptions)
      .values({ userId: testUser.id, feedId: feed.id })
      .returning();

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

    // 3. Attempt to update as the test user
    await expect(
      updateSubscription(tx, testUser.id, sub.id, { customTitle: "Sneaky" }),
    ).rejects.toThrow(SubscriptionNotFoundError);
  });
});
