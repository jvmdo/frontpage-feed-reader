"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type CheckNewItemsInput,
  checkNewItemsSchema,
} from "@/lib/validations/feed";
import { countNewItems } from "@/services/item/count-new-items";

/**
 * Server action to count new items since a specific date.
 * Used for background polling to show UI notifications.
 */
export async function checkNewItemsAction(input: CheckNewItemsInput) {
  const result = checkNewItemsSchema.safeParse(input);

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
        error: "You must be signed in to check for new items.",
        code: "UNAUTHORIZED",
      };
    }

    const count = await countNewItems(db, session.user.id, result.data);

    return {
      success: true,
      data: { count },
    };
  } catch (error) {
    console.error("[checkNewItemsAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred while checking for new items.",
      code: "INTERNAL_ERROR",
    };
  }
}
