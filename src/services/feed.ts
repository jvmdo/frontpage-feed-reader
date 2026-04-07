import { and, asc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { fetchFeedMetadata } from "@/lib/feed/parser";
import type { UpdateFeed, UpdateSubscription } from "@/types";

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
/**
 * Retrieves a single subscription joined with its feed metadata.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user who owns the subscription.
 * @param subscriptionId - The ID of the subscription to fetch.
 */
export async function getSubscriptionWithFeed(
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

/**
 * Update feed metadata and health status.
 * @param db - Drizzle database instance.
 * @param feedId - The ID of the feed to update.
 * @param data - The data to update (title, description, healthStatus, etc.).
 */
export async function updateFeedMetadata(
  db: DB,
  feedId: number,
  data: UpdateFeed,
) {
  const [updatedFeed] = await db
    .update(feeds)
    .set(data)
    .where(eq(feeds.id, feedId))
    .returning();

  return updatedFeed;
}

/**
 * Create a feed subscription for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose subscriptions to create.
 */
export async function addFeedToUser(db: DB, userId: string, url: string) {
  return await db.transaction(async (tx) => {
    // 1. Check if feed exists, or fetch and create it
    let feed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, url),
    });

    if (!feed) {
      const metadata = await fetchFeedMetadata(url);

      const [newFeed] = await tx
        .insert(feeds)
        .values({
          url,
          title: metadata.title,
          description: metadata.description,
          healthStatus: "healthy",
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
        })
        .onConflictDoNothing() // Don't throw on race conditions
        .returning();

      // Find the feed that couldn't be returned due to a conflict
      const existingFeed = await tx.query.feeds.findFirst({
        where: eq(feeds.url, url),
      });

      feed = newFeed ?? existingFeed;
    }

    // 2. Check if subscription already exists
    const existingSubscription = await tx.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.feedId, feed.id),
      ),
    });

    if (existingSubscription) {
      return { subscription: existingSubscription, feed };
    }

    // 3. Create subscription
    const [subscription] = await tx
      .insert(subscriptions)
      .values({
        userId,
        feedId: feed.id,
      })
      .returning();

    return { subscription, feed: feed };
  });
}
