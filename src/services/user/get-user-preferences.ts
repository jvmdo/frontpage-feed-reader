import { eq } from "drizzle-orm";
import type { DB } from "@/db";
import { userPreferences } from "@/db/schema";

/**
 * Retrieves preferences for a specific user.
 * Returns null if no preferences are found.
 */
export async function getUserPreferences(db: DB, userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  return prefs ?? null;
}
