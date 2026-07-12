"use server";

import { db } from "@/db";
import { DuplicateCategoryError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type CreateCategoryInput,
  createCategorySchema,
} from "@/lib/validations/category";
import { createCategory } from "@/services/category/create-category";
import type { ServerActionResult } from "@/types";

/**
 * Server action to create a category.
 * @param input - Data for creating a category, validated by createCategorySchema.
 */
export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<ServerActionResult> {
  const result = createCategorySchema.safeParse(input);

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
        error: "You must be signed in to create a category.",
        code: "UNAUTHORIZED",
      };
    }

    const { name, color } = result.data;

    await createCategory(db, session.user.id, name, color);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[createCategoryAction]", error);

    if (error instanceof DuplicateCategoryError) {
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
