"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { InvalidPasswordError, PasswordRequiredError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type DeleteAccountInput,
  deleteAccountSchema,
} from "@/lib/validations/profile";
import { deleteUserService } from "@/services/user/delete-user";

/**
 * Server action to delete the user's account.
 */
export async function deleteUserAction(input: DeleteAccountInput) {
  const result = deleteAccountSchema.safeParse(input);

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
        error: "You must be signed in to delete your account.",
        code: "UNAUTHORIZED",
      };
    }

    const headersList = await headers();
    await deleteUserService(db, session.user.id, result.data, headersList);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[deleteUserAction]", error);

    if (
      error instanceof PasswordRequiredError ||
      error instanceof InvalidPasswordError
    ) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    const err = error as Error & {
      code?: string;
      body?: { code?: string; message?: string };
    };

    const errorCode = err?.body?.code || err?.code || "INTERNAL_ERROR";
    const errorMessage =
      err?.body?.message ||
      err?.message ||
      "An unexpected error occurred while deleting your account.";

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}
