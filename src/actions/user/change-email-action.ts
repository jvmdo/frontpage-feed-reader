"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import {
  CredentialAccountRequiredError,
  EmailAlreadyInUseError,
  InvalidPasswordError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type ChangeEmailInput,
  changeEmailSchema,
} from "@/lib/validations/profile";
import { updateUserEmail } from "@/services/user/update-user-email";

/**
 * Server action to update user email.
 * @param input - The change email inputs.
 */
export async function changeEmailAction(input: ChangeEmailInput) {
  const result = changeEmailSchema.safeParse(input);

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
        error: "You must be signed in to update your email.",
        code: "UNAUTHORIZED",
      };
    }

    const headersList = await headers();
    await updateUserEmail(db, session.user.id, result.data, headersList);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[changeEmailAction]", error);

    if (
      error instanceof EmailAlreadyInUseError ||
      error instanceof CredentialAccountRequiredError ||
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
      "An unexpected error occurred while updating your email.";

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}
