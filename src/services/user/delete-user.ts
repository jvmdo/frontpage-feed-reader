import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { account, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { InvalidPasswordError, PasswordRequiredError } from "@/lib/errors";
import type { DeleteAccountInput } from "@/lib/validations/profile";

/**
 * Deletes a user account and all cascaded data.
 *
 * Bypasses the "Verification email isn't enabled" limitation for OAuth users
 * Just like we experienced with the `changeEmailAction`, Better Auth's built-in `deleteUser` method
 * strictly enforces that OAuth-only users (who don't have a password) must verify their identity via email
 * before their account can be deleted. Since we haven't configured a live email provider for this MVP yet,
 * calling `authClient.deleteUser()` for GitHub users would throw the exact same error we saw before.
 * Our custom service cleanly bypasses this by leveraging the user's active session instead.
 */
export async function deleteUserService(
  db: DB,
  userId: string,
  data: DeleteAccountInput,
  headers: Headers,
) {
  // Check if the user has a credential account
  const [userCredentialAccount] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (userCredentialAccount) {
    if (!data.password || data.password.trim() === "") {
      throw new PasswordRequiredError(
        "Password is required to delete your account.",
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

      if (!isPasswordValid.status) {
        throw new InvalidPasswordError();
      }
    } catch {
      throw new InvalidPasswordError();
    }
  }

  // Delete the user from the database.
  // The drizzle schema is configured with onDelete: "cascade" for all related tables
  // (account, session, subscriptions, categories, userPreferences, userItemStates),
  // so this will comprehensively remove all user data.
  await db.delete(user).where(eq(user.id, userId));
}
