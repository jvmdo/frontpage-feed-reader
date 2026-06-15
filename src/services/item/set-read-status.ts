import type { DB } from "@/db";
import { userItemStates } from "@/db/schema";

/**
 * Sets the read status of a feed item for a specific user.
 * Uses an upsert (on conflict do update) to handle the sparse state pattern.
 *
 * @param db - The database instance.
 * @param userId - The ID of the user performing the action.
 * @param itemId - The ID of the feed item.
 * @param isRead - Whether the item should be marked as read.
 * @returns The resulting user item state record.
 */
export async function setReadStatus(
  db: DB,
  userId: string,
  itemId: number,
  isRead = true,
) {
  const readAtValue = isRead ? new Date() : null;
  const [result] = await db
    .insert(userItemStates)
    .values({
      userId,
      itemId,
      readAt: readAtValue,
    })
    .onConflictDoUpdate({
      target: [userItemStates.userId, userItemStates.itemId],
      set: {
        readAt: readAtValue,
      },
    })
    .returning();

  return result;
}
