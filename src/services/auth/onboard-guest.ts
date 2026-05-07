import type { DB } from "@/db";
import { userPreferences } from "@/db/schema";
import { DuplicateCategoryError } from "@/lib/errors";
import { createCategory } from "@/services/category/create-category";
import { createSubscription } from "@/services/subscription/create-subscription";
import sampleFeeds from "../../../data/sample-feeds.json";

const CATEGORY_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
];

/**
 * Onboards a guest user by pre-populating their account with curated feeds.
 * This includes creating default categories, subscriptions, and initializing preferences.
 *
 * @param db - Drizzle database instance.
 * @param userId - The ID of the guest user.
 */
export async function onboardGuest(db: DB, userId: string) {
  // 1. Initialize user preferences with a 7-day historical watermark
  try {
    await db
      .insert(userPreferences)
      .values({
        userId,
        markedAllReadAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .onConflictDoNothing();
  } catch (_err) {
    // Ignore initialization errors
  }

  // 2. Prepare category creation tasks
  const categoryPromises = sampleFeeds.categories.map(
    async (categoryData, i) => {
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      let categoryId: number | undefined;

      try {
        const category = await createCategory(
          db,
          userId,
          categoryData.name,
          color,
        );
        categoryId = category.id;
      } catch (error) {
        if (error instanceof DuplicateCategoryError) {
          const existingCategory = await db.query.categories.findFirst({
            where: (categories, { and, eq }) =>
              and(
                eq(categories.userId, userId),
                eq(categories.name, categoryData.name),
              ),
          });
          categoryId = existingCategory?.id;
        } else {
          // Log error but continue with other categories
          return;
        }
      }

      if (!categoryId) return;

      // 3. Create subscriptions for each feed in the category in parallel
      const subscriptionPromises = categoryData.feeds.map((feed) => {
        return createSubscription(db, userId, feed.feedUrl, categoryId).catch(
          (_err) => {
            // Ignore individual subscription failures
          },
        );
      });

      await Promise.all(subscriptionPromises);
    },
  );

  // Execute all category and subscription creations
  await Promise.all(categoryPromises);
}
