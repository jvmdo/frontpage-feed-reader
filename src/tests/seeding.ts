import fs from "node:fs";
import path from "node:path";
import type { DB } from "@/db";
import * as schema from "@/db/schema";

import { parseFeedXml } from "@/lib/feed/parser";
import type {
  NewAccount,
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
 * Seeds a Better Auth account into the database.
 */
export async function seedAccount(
  tx: DB,
  overrides: Partial<NewAccount> & { userId: string },
) {
  const id = overrides.id ?? `acc_${Math.random().toString(36).slice(2)}`;
  const providerId = overrides.providerId ?? "credential";
  const [inserted] = await tx
    .insert(schema.account)
    .values({
      id,
      accountId: overrides.accountId ?? overrides.userId,
      providerId,
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
    .values({
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // Default to 1 hour ago in tests
      ...overrides,
    })
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
  const feed = await seedFeed(tx, {
    url:
      feedOverrides.url ??
      `https://example.com/${Math.random().toString(36).slice(2)}?tenant=${userId}`,
    ...feedOverrides,
  });
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
    createdAt: item.createdAt ?? new Date(),
    ...item,
  }));

  return await tx.insert(schema.feedItems).values(values).returning();
}

/**
 * Seeds the global curated feeds and their items used by the 'Try as Guest' experience.
 * This prevents real network calls during onboarding in E2E tests.
 *
 * @param tx - Drizzle database or transaction instance.
 */
export async function seedCuratedFeeds(tx: DB) {
  // 1. Process Metadata
  const feedsToSeed = [
    ...sampleFeeds.categories.flatMap((c) =>
      c.feeds.map((f) => ({
        url: f.feedUrl,
        title: f.title,
        description: f.description,
        isCurated: true,
      })),
    ),
  ];

  await tx.insert(schema.feeds).values(feedsToSeed).onConflictDoNothing();

  // 2. Process Fixture Items for other curated feeds
  for (const category of sampleFeeds.categories) {
    for (const feedData of category.feeds) {
      const fixtureName = (feedData as any).fixture;
      if (!fixtureName) continue;

      const feed = await tx.query.feeds.findFirst({
        where: (feeds, { eq }) => eq(feeds.url, feedData.feedUrl),
      });

      if (feed) {
        const fixturePath = path.join(
          process.cwd(),
          "data",
          "fixtures",
          fixtureName,
        );

        if (fs.existsSync(fixturePath)) {
          const xml = fs.readFileSync(fixturePath, "utf-8");
          const parsed = await parseFeedXml(xml, feedData.feedUrl);

          if (parsed.items.length > 0) {
            await tx
              .insert(schema.feedItems)
              .values(
                parsed.items.map((item) => ({
                  ...item,
                  feedId: feed.id,
                })),
              )
              .onConflictDoNothing();
          }
        }
      }
    }
  }
}
