import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { subscriptions } from "@/db/schema";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { getSubscriptionByFeedId } from "@/services/subscription/get-subscription-by-feed-id";
import { getSubscriptions } from "@/services/subscription/get-subscriptions";

export type RefreshOptions =
  | { scope: "global"; id?: never }
  | { scope: "category"; id: number }
  | { scope: "feed"; id: number };

/**
 * Refresh feeds based on a scope (global, category, or specific feed).
 * Orchestrates the fetching of target feeds and triggers their ingestion.
 * @param db - Drizzle database instance.
 * @param userId - ID of the user performing the refresh.
 * @param options - Scope and entity ID.
 */
export async function refreshFeeds(
  db: DB,
  userId: string,
  options: RefreshOptions,
) {
  if (options.scope === "feed") {
    const subscription = await getSubscriptionByFeedId(db, userId, options.id);
    if (!subscription) return null;

    await ingestItems(db, subscription.feed.id);
    return getSubscriptionByFeedId(db, userId, options.id);
  }

  const feedIds = await resolveTargetFeedIds(db, userId, options);
  if (feedIds.length === 0) return undefined;

  const results = await Promise.allSettled(
    feedIds.map((feedId) => ingestItems(db, feedId)),
  );

  const failures = results.filter((r) => r.status === "rejected");
  const allFailed = failures.length === feedIds.length;

  if (allFailed) throw new Error("All feeds failed to refresh");
}

async function resolveTargetFeedIds(
  db: DB,
  userId: string,
  options: RefreshOptions,
): Promise<number[]> {
  if (options.scope === "global") {
    const subs = await getSubscriptions(db, userId);
    return subs.map((s) => s.feed.id);
  }

  const categorySubs = await db
    .select({ feedId: subscriptions.feedId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.categoryId, options.id),
      ),
    );

  return categorySubs.map((s) => s.feedId);
}
