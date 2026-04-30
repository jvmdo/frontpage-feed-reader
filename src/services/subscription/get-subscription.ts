import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";

/**
 * Retrieves a single subscription joined with its feed metadata.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the subscription.
 * @param subscriptionId - The ID of the subscription to fetch.
 */
export async function getSubscription(
  db: DB,
  userId: string,
  subscriptionId: number,
) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      feed: feeds,
    })
    .from(subscriptions)
    .innerJoin(feeds, eq(subscriptions.feedId, feeds.id))
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, userId),
      ),
    )
    .limit(1);

  return row;
}
