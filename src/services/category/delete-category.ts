import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { categories } from "@/db/schema";
import { CategoryNotFoundError } from "@/lib/errors";

/**
 * Deletes a category for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user.
 * @param categoryId - The ID of the category to delete.
 */
export async function deleteCategory(
  db: DB,
  userId: string,
  categoryId: number,
) {
  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning();

  if (!deleted) {
    throw new CategoryNotFoundError();
  }

  return deleted;
}
