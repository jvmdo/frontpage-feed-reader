import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { subscriptions } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";

/**
 * Delete a feed subscription for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the subscription.
 * @param subscriptionId - The ID of the subscription to delete.
 */
export async function deleteSubscription(
  db: DB,
  userId: string,
  subscriptionId: number,
) {
  const [deleted] = await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, userId),
      ),
    )
    .returning();

  if (!deleted) {
    throw new SubscriptionNotFoundError();
  }

  return deleted;
}
