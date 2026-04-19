import { asc, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { categories } from "@/db/schema";

/**
 * Retrieves all categories for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user whose categories to fetch.
 * @returns A list of categories.
 */
export async function getUserCategories(db: DB, userId: string) {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
}
