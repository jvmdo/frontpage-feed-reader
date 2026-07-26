"use server";

import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { InvalidPasswordError, PasswordRequiredError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import {
  type DeleteAccountInput,
  deleteAccountSchema,
} from "@/lib/validations/profile";
import { deleteUserService } from "@/services/user/delete-user";
import type { ServerActionResult } from "@/types";

/**
 * Server action to delete the user's account.
 */
export async function deleteUserAction(
  input: DeleteAccountInput,
): Promise<ServerActionResult> {
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

    // Because `deleteUserService` bypasses Better Auth's built-in SDK deleteUser method,
    // we manually expire both standard and secure Better Auth session cookies to ensure
    // the browser cookie is destroyed before the client navigates to public routes.
    const cookieStore = await cookies();
    cookieStore.delete({
      name: "better-auth.session_token",
      path: "/",
    });
    cookieStore.delete({
      name: "__Secure-better-auth.session_token",
      path: "/",
      secure: true,
    });

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
