"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type ToggleBookmarkInput,
  toggleBookmarkSchema,
} from "@/lib/validations/feed";
import { toggleBookmark } from "@/services/item/toggle-bookmark";

/**
 * Server action to toggle the bookmark status of an item.
 * Supports both Guest and Member sessions.
 *
 * @param input - Item ID to toggle, validated by toggleBookmarkSchema.
 */
export async function toggleBookmarkAction(input: ToggleBookmarkInput) {
  const result = toggleBookmarkSchema.safeParse(input);

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
      error: "You must have a valid session to perform this action.",
      code: "UNAUTHORIZED",
    };
  }

  const { itemId } = result.data;

  try {
    const state = await toggleBookmark(db, session.user.id, itemId);

    return {
      success: true,
      data: state,
    };
  } catch (error) {
    console.error("[toggleBookmarkAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    };
  }
}
