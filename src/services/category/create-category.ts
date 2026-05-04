import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { categories } from "@/db/schema";
import { DuplicateCategoryError } from "@/lib/errors";

/**
 * Creates a new category for a user.
 * @param db - Drizzle database instance.
 * @param userId - The ID of the user.
 * @param name - The name of the category.
 * @param color - The color of the category (optional).
 * @returns The newly created category.
 */
export async function createCategory(
  db: DB,
  userId: string,
  name: string,
  color?: string,
) {
  // Check if category with same name already exists for this user
  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.userId, userId), eq(categories.name, name)),
  });

  if (existing) {
    throw new DuplicateCategoryError();
  }

  const [newCategory] = await db
    .insert(categories)
    .values({
      userId,
      name,
      color,
    })
    .returning();

  return newCategory;
}
