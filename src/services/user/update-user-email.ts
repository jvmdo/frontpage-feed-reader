import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { account, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  CredentialAccountRequiredError,
  EmailAlreadyInUseError,
  InvalidPasswordError,
} from "@/lib/errors";
import type { ChangeEmailInput } from "@/lib/validations/profile";

/**
 * Updates a user's email address.
 * Verifies current password and calls Better Auth's changeEmail, falling back to direct db update if verification email is disabled.
 */
export async function updateUserEmail(
  db: DB,
  userId: string,
  data: ChangeEmailInput,
  headers: Headers,
) {
  // Check if the email is already registered
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, data.newEmail.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new EmailAlreadyInUseError(
      "Unable to update email address. Please ensure the email is correct and available, or try a different address.",
    );
  }

  // Check if the user has a credential account
  const [userCredentialAccount] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (!userCredentialAccount) {
    throw new CredentialAccountRequiredError(
      "Only accounts with a password can update their email.",
    );
  }

  // Verify current password
  try {
    const isPasswordValid = await auth.api.verifyPassword({
      body: {
        password: data.password,
      },
      headers,
    });

    // Some versions or configurations of Better Auth might return a { status: false }
    if (!isPasswordValid.status) {
      throw new InvalidPasswordError();
    }
  } catch {
    throw new InvalidPasswordError();
  }

  // Call Better Auth's changeEmail API
  try {
    await auth.api.changeEmail({
      body: {
        newEmail: data.newEmail,
      },
      headers,
    });
  } catch (error: any) {
    const status = error?.status;
    const message = error?.body?.message;

    if (
      status === "BAD_REQUEST" &&
      message === "Verification email isn't enabled"
    ) {
      // Fallback: direct update to user email
      await db
        .update(user)
        .set({ email: data.newEmail })
        .where(eq(user.id, userId));

      // Direct update to credential account ID
      await db
        .update(account)
        .set({ accountId: data.newEmail })
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "credential")),
        );
    } else {
      throw error;
    }
  }
}
