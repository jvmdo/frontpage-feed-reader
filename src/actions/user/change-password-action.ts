"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { PasswordRequiredError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type ChangePasswordInput,
  changePasswordSchema,
} from "@/lib/validations/profile";
import { updateUserPassword } from "@/services/user/update-user-password";
import type { ServerActionResult } from "@/types";

/**
 * Server action to update user password.
 * @param input - The password change inputs.
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ServerActionResult> {
  const result = changePasswordSchema.safeParse(input);

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
        error: "You must be signed in to update your password.",
        code: "UNAUTHORIZED",
      };
    }

    const headersList = await headers();
    await updateUserPassword(db, session.user.id, result.data, headersList);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[changePasswordAction]", error);

    if (error instanceof PasswordRequiredError) {
      return {
        success: false,
        error: error.message,
        code: "PASSWORD_REQUIRED",
      };
    }

    // Include Better Auth's specific APIError structure
    const err = error as Error & {
      code?: string;
      body?: { code?: string; message?: string };
    };

    // Check the nested body first, then fallback to root properties
    const errorCode = err?.body?.code || err?.code || "INTERNAL_ERROR";
    let errorMessage =
      err?.body?.message ||
      err?.message ||
      "An unexpected error occurred while updating your password.";

    if (errorCode === "INVALID_PASSWORD") {
      errorMessage =
        "The current password you entered is incorrect. Please try again.";
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}
