import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { subscriptions } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import type { UpdateSubscription } from "@/types";

/**
 * Update a subscription's custom title.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the subscription.
 * @param subscriptionId - The ID of the subscription to update.
 * @param data - The data to update (customTitle).
 */
export async function updateSubscription(
  db: DB,
  userId: string,
  subscriptionId: number,
  data: UpdateSubscription,
) {
  const [subscription] = await db
    .update(subscriptions)
    .set(data)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, userId),
      ),
    )
    .returning();

  if (!subscription) {
    throw new SubscriptionNotFoundError();
  }

  return subscription;
}
