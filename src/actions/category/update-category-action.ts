"use server";

import { db } from "@/db";
import { CategoryNotFoundError, DuplicateCategoryError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/validations/category";
import { updateCategory } from "@/services/category/update-category";

/**
 * Server action to update a category.
 * @param input - Data for updating a category, validated by updateCategorySchema.
 */
export async function updateCategoryAction(input: UpdateCategoryInput) {
  const result = updateCategorySchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid input",
      code: "VALIDATION_ERROR",
    };
  }

  const session = await getCurrentSession();

  if (!session?.user) {
    return {
      success: false,
      error: "You must be signed in to update a category.",
      code: "UNAUTHORIZED",
    };
  }

  const { id, name } = result.data;

  try {
    const category = await updateCategory(db, session.user.id, id, name);

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("[updateCategoryAction]", error);

    if (error instanceof DuplicateCategoryError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    if (error instanceof CategoryNotFoundError) {
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
