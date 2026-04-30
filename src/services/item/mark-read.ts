import type { DB } from "@/db";
import { userItemStates } from "@/db/schema";

/**
 * Marks a feed item as read for a specific user.
 * Uses an upsert (on conflict do update) to handle the sparse state pattern.
 * 
 * @param db - The database instance.
 * @param userId - The ID of the user performing the action.
 * @param itemId - The ID of the feed item to mark as read.
 * @returns The resulting user item state record.
 */
export async function markRead(db: DB, userId: string, itemId: number) {
  const [result] = await db
    .insert(userItemStates)
    .values({
      userId,
      itemId,
      readAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userItemStates.userId, userItemStates.itemId],
      set: {
        readAt: new Date(),
      },
    })
    .returning();

  return result;
}
