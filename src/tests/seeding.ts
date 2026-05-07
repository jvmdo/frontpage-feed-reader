import type { DB } from "@/db";
import * as schema from "@/db/schema";
import type {
  NewCategory,
  NewFeed,
  NewItem,
  NewSubscription,
  NewUser,
  NewUserItemState,
  NewUserPreferences,
} from "@/types";
import sampleFeeds from "../../data/sample-feeds.json";

/**
 * Seeds a user into the database.
 */
export async function seedUser(tx: DB, overrides: Partial<NewUser> = {}) {
  const id = overrides.id ?? `user_${Math.random().toString(36).slice(2)}`;
  const [inserted] = await tx
    .insert(schema.user)
    .values({
      id,
      name: "Test User",
      email: `${id}@example.com`,
      ...overrides,
    })
    .returning();
  return inserted;
}

/**
 * Seeds a feed into the database.
 */
export async function seedFeed(tx: DB, overrides: Partial<NewFeed> = {}) {
  const [inserted] = await tx
    .insert(schema.feeds)
    .values({
      url: `https://example.com/${Math.random().toString(36).slice(2)}`,
      title: "Sample Feed",
      healthStatus: "healthy",
      ...overrides,
    })
    .returning();
  return inserted;
}

/**
 * Seeds a subscription into the database.
 */
export async function seedSubscription(tx: DB, overrides: NewSubscription) {
  const [inserted] = await tx
    .insert(schema.subscriptions)
    .values(overrides)
    .returning();
  return inserted;
}

/**
 * Seeds a feed and a subscription for a user.
 */
export async function seedFeedWithSubscription(
  tx: DB,
  userId: string,
  feedOverrides: Partial<NewFeed> = {},
  subOverrides: Partial<Omit<NewSubscription, "userId" | "feedId">> = {},
) {
  const feed = await seedFeed(tx, feedOverrides);
  const subscription = await seedSubscription(tx, {
    userId,
    feedId: feed.id,
    ...subOverrides,
  });
  return { feed, subscription };
}

/**
 * Seeds a category into the database.
 */
export async function seedCategory(tx: DB, overrides: NewCategory) {
  const [inserted] = await tx
    .insert(schema.categories)
    .values(overrides)
    .returning();
  return inserted;
}

/**
 * Seeds user preferences into the database.
 */
export async function seedUserPreferences(
  tx: DB,
  overrides: NewUserPreferences,
) {
  const [inserted] = await tx
    .insert(schema.userPreferences)
    .values(overrides)
    .onConflictDoUpdate({
      target: schema.userPreferences.userId,
      set: overrides,
    })
    .returning();
  return inserted;
}

/**
 * Seeds a user item state into the database.
 */
export async function seedUserItemState(tx: DB, overrides: NewUserItemState) {
  const [inserted] = await tx
    .insert(schema.userItemStates)
    .values(overrides)
    .onConflictDoUpdate({
      target: [schema.userItemStates.userId, schema.userItemStates.itemId],
      set: overrides,
    })
    .returning();
  return inserted;
}

/**
 * Seeds multiple feed items for a specific feed.
 */
export async function seedItems(
  tx: DB,
  feedId: number,
  items: Partial<NewItem>[],
) {
  const values = items.map((item, index) => ({
    feedId,
    guid: item.guid ?? `guid-${index}-${Math.random().toString(36).slice(2)}`,
    title: item.title ?? `Item ${index}`,
    publishedAt: item.publishedAt ?? new Date(),
    ...item,
  }));

  return await tx.insert(schema.feedItems).values(values).returning();
}

/**
 * Seeds the global curated feeds used by the 'Try as Guest' experience.
 * This prevents real network calls during onboarding in E2E tests.
 *
 * @param tx - Drizzle database or transaction instance.
 */
export async function seedCuratedFeeds(tx: DB) {
  for (const category of sampleFeeds.categories) {
    for (const feedData of category.feeds) {
      const [feed] = await tx
        .insert(schema.feeds)
        .values({
          url: feedData.feedUrl,
          title: feedData.title,
          description: feedData.description,
          healthStatus: "healthy",
        })
        .onConflictDoUpdate({
          target: schema.feeds.url,
          set: { title: feedData.title },
        })
        .returning();

      // Seed at least one item for Smashing Magazine to verify content display
      if (feedData.title === "Smashing Magazine") {
        await tx
          .insert(schema.feedItems)
          .values({
            feedId: feed.id,
            guid: "seed-smash-1",
            title: "Seeded Smashing Article",
            url: "https://smashingmagazine.com/seeded",
            publishedAt: new Date(),
          })
          .onConflictDoNothing();
      }
    }
  }
}
