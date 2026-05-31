import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { userItemStates } from "@/db/schema";

/**
 * Toggles the bookmark status of a feed item for a specific user.
 * If the item is already bookmarked, it removes the bookmark (sets bookmarkedAt to null).
 * If not, it sets bookmarkedAt to the current timestamp.
 *
 * @param db - The database instance.
 * @param userId - The ID of the user performing the action.
 * @param itemId - The ID of the feed item to toggle.
 * @returns The resulting user item state record.
 */
export async function toggleBookmark(db: DB, userId: string, itemId: number) {
  const [existing] = await db
    .select({ bookmarkedAt: userItemStates.bookmarkedAt })
    .from(userItemStates)
    .where(
      and(eq(userItemStates.userId, userId), eq(userItemStates.itemId, itemId)),
    )
    .limit(1);

  const newBookmarkedAt = existing?.bookmarkedAt ? null : new Date();

  const [result] = await db
    .insert(userItemStates)
    .values({
      userId,
      itemId,
      bookmarkedAt: newBookmarkedAt,
    })
    .onConflictDoUpdate({
      target: [userItemStates.userId, userItemStates.itemId],
      set: {
        bookmarkedAt: newBookmarkedAt,
      },
    })
    .returning();

  return result;
}
