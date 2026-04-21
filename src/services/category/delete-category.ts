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
  // First, verify the category exists and belongs to the user
  const existingCategory = await db.query.categories.findFirst({
    where: and(eq(categories.userId, userId), eq(categories.id, categoryId)),
  });

  if (!existingCategory) {
    throw new CategoryNotFoundError();
  }

  await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));
}
