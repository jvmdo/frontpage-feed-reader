import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { categories } from "@/db/schema";
import { CategoryNotFoundError, DuplicateCategoryError } from "@/lib/errors";

/**
 * Updates a category for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user.
 * @param categoryId - The ID of the category to update.
 * @param name - The new name of the category.
 * @returns The updated category.
 */
export async function updateCategory(
  db: DB,
  userId: string,
  categoryId: number,
  name: string,
) {
  // First, verify the category exists and belongs to the user
  const existingCategory = await db.query.categories.findFirst({
    where: and(eq(categories.userId, userId), eq(categories.id, categoryId)),
  });

  if (!existingCategory) {
    throw new CategoryNotFoundError();
  }

  // Check if a category with the new name already exists for this user
  if (existingCategory.name !== name) {
    const duplicate = await db.query.categories.findFirst({
      where: and(eq(categories.userId, userId), eq(categories.name, name)),
    });

    if (duplicate) {
      throw new DuplicateCategoryError();
    }
  }

  const [updatedCategory] = await db
    .update(categories)
    .set({ name })
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning();

  return updatedCategory;
}
