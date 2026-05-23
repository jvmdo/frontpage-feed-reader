"use server";

import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import {
  type UpdatePreferencesInput,
  updatePreferencesSchema,
} from "@/lib/validations/user";
import { updateUserPreferences } from "@/services/user/update-user-preferences";

/**
 * Server action to update user preferences.
 * @param input - The preferences to update.
 */
export async function updatePreferencesAction(input: UpdatePreferencesInput) {
  const result = updatePreferencesSchema.safeParse(input);

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
        error: "You must be signed in to update preferences.",
        code: "UNAUTHORIZED",
      };
    }

    await updateUserPreferences(db, session.user.id, result.data);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[updatePreferencesAction]", error);
    return {
      success: false,
      error: "An unexpected error occurred while updating preferences.",
      code: "INTERNAL_ERROR",
    };
  }
}
