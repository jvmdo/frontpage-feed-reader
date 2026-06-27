import { and, count, eq, isNotNull } from "drizzle-orm";
import type { DB } from "@/db";
import { categories, subscriptions, userItemStates } from "@/db/schema";

/**
 * Retrieves stats for a user including counts of subscriptions, categories, read items, and bookmarks.
 *
 * @param db The database client or transaction instance.
 * @param userId The ID of the user.
 * @returns An object containing the counts.
 */
export async function getUserStats(db: DB, userId: string) {
  const [subCount, catCount, readCount, bookmarkCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId)),
    db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.userId, userId)),
    db
      .select({ count: count() })
      .from(userItemStates)
      .where(
        and(
          eq(userItemStates.userId, userId),
          isNotNull(userItemStates.readAt),
        ),
      ),
    db
      .select({ count: count() })
      .from(userItemStates)
      .where(
        and(
          eq(userItemStates.userId, userId),
          isNotNull(userItemStates.bookmarkedAt),
        ),
      ),
  ]);

  return {
    subscriptions: subCount[0]?.count ?? 0,
    categories: catCount[0]?.count ?? 0,
    readArticles: readCount[0]?.count ?? 0,
    bookmarkedArticles: bookmarkCount[0]?.count ?? 0,
  };
}
