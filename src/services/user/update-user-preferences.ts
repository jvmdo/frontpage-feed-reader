import type { DB } from "@/db";
import { userPreferences } from "@/db/schema";
import type { UpdatePreferencesInput } from "@/lib/validations/user";

/**
 * Updates or creates preferences for a user.
 * @param db - Drizzle database instance.
 * @param userId - ID of the user.
 * @param data - The preference data to set.
 */
export async function updateUserPreferences(
  db: DB,
  userId: string,
  data: UpdatePreferencesInput,
) {
  return await db
    .insert(userPreferences)
    .values({
      userId,
      ...data,
    })
    .onConflictDoUpdate({
      target: [userPreferences.userId],
      set: data,
    });
}
