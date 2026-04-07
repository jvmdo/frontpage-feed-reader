import { eq } from "drizzle-orm";
import type { DB } from "@/db";
import { feeds } from "@/db/schema";
import type { UpdateFeed } from "@/types";

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
