import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";

/**
 * Retrieves a single subscription joined with its feed metadata by the feed ID.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the subscription.
 * @param feedId - The ID of the feed to fetch the subscription for.
 */
export async function getSubscriptionByFeedId(
  db: DB,
  userId: string,
  feedId: number,
) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      feed: feeds,
    })
    .from(subscriptions)
    .innerJoin(feeds, eq(subscriptions.feedId, feeds.id))
    .where(
      and(eq(subscriptions.feedId, feedId), eq(subscriptions.userId, userId)),
    )
    .limit(1);

  return row;
}
