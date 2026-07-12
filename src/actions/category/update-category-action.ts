"use server";

import { db } from "@/db";
import { CategoryNotFoundError, DuplicateCategoryError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/validations/category";
import { updateCategory } from "@/services/category/update-category";
import type { Category, ServerActionResult } from "@/types";

/**
 * Server action to update a category.
 * @param input - Data for updating a category, validated by updateCategorySchema.
 */
export async function updateCategoryAction(
  input: UpdateCategoryInput,
): Promise<ServerActionResult<Category>> {
  const result = updateCategorySchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid input",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return {
        success: false,
        error: "You must be signed in to update a category.",
        code: "UNAUTHORIZED",
      };
    }

    const { id, name, color } = result.data;

    const category = await updateCategory(db, session.user.id, id, name, color);

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("[updateCategoryAction]", error);

    if (
      error instanceof DuplicateCategoryError ||
      error instanceof CategoryNotFoundError
    ) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
