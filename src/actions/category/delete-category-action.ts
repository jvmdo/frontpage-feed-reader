"use server";

import { db } from "@/db";
import { CategoryNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type DeleteCategoryInput,
  deleteCategorySchema,
} from "@/lib/validations/category";
import { deleteCategory } from "@/services/category/delete-category";
import type { Category, ServerActionResult } from "@/types";

/**
 * Server action to delete a category.
 * @param input - Data for deleting a category, validated by deleteCategorySchema.
 */
export async function deleteCategoryAction(
  input: DeleteCategoryInput,
): Promise<ServerActionResult<Category>> {
  const result = deleteCategorySchema.safeParse(input);

  if (!result.success) {
    console.log(result.error.issues);
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
        error: "You must be signed in to delete a category.",
        code: "UNAUTHORIZED",
      };
    }

    const { id } = result.data;

    const deleted = await deleteCategory(db, session.user.id, id);

    return {
      success: true,
      data: deleted,
    };
  } catch (error) {
    console.error("[deleteCategoryAction]", error);

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
