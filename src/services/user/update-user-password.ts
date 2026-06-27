import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { account } from "@/db/schema";
import { auth } from "@/lib/auth";
import { PasswordRequiredError } from "@/lib/errors";
import type { ChangePasswordInput } from "@/lib/validations/profile";

/**
 * Updates or sets the password for a user.
 * If the user has a "credential" account, a `currentPassword` is required and `auth.api.changePassword` is used.
 * Otherwise, `auth.api.setPassword` is used.
 */
export async function updateUserPassword(
  db: DB,
  userId: string,
  data: ChangePasswordInput,
  headers: Headers,
) {
  // Query the account table to check if a credential provider exists.
  const [userCredentialAccount] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (userCredentialAccount) {
    // Credential exists. We must change the password.
    if (!data.currentPassword || data.currentPassword.trim() === "") {
      throw new PasswordRequiredError();
    }

    return await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      headers,
    });
  } else {
    // No credential account exists. We set the password.
    return await auth.api.setPassword({
      body: {
        newPassword: data.newPassword,
      },
      headers,
    });
  }
}
