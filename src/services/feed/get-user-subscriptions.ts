import { asc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";

/**
 * Retrieves all subscriptions for a user, joined with their corresponding feed metadata.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose subscriptions to fetch.
 * @returns A list of subscriptions with their associated feed data.
 */
export async function getUserSubscriptions(db: DB, userId: string) {
  return await db
    .select({
      subscription: subscriptions,
      feed: feeds,
    })
    .from(subscriptions)
    .innerJoin(feeds, eq(subscriptions.feedId, feeds.id))
    .where(eq(subscriptions.userId, userId))
    .orderBy(asc(feeds.title));
}
