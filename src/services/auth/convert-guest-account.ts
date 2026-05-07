import { eq } from "drizzle-orm";
import type { DB } from "@/db";
import { account, session, user } from "@/db/schema";
import type { NewUser } from "@/types";

/**
 * Implements "Reversed Linking" (Poteboy Pattern).
 *
 * This function upgrades an anonymous guest user to a full member in-place.
 * Instead of migrating user data from the guest ID to a new user ID, it does the opposite:
 * 1. Attaches the newly created authentication records (Account and Session) to the existing Guest ID.
 * 2. Deletes the redundant User record created by the social/email signup.
 * 3. Upgrades the Guest User record with permanent identity fields (email, name, image).
 *
 * This preserves all existing guest data (categories, subscriptions, read states) without
 * needing complex multi-table migrations or cache invalidations.
 *
 * @see https://github.com/better-auth/better-auth/issues/4180
 *
 * @param db - The Drizzle database or transaction instance.
 * @param anonymousUserId - The stable ID of the guest user to be upgraded.
 * @param newUser - The temporary user object containing the new permanent credentials.
 */
export async function convertGuestToMember(
  db: DB,
  anonymousUserId: string,
  newUser: NewUser,
) {
  await db.transaction(async (tx) => {
    // 1. Move account and session to Guest ID
    await tx
      .update(account)
      .set({ userId: anonymousUserId })
      .where(eq(account.userId, newUser.id));

    await tx
      .update(session)
      .set({ userId: anonymousUserId })
      .where(eq(session.userId, newUser.id));

    // 2. Delete newUser to free up email and prevent redundancy
    await tx.delete(user).where(eq(user.id, newUser.id));

    // 3. Upgrade Guest to Member
    await tx
      .update(user)
      .set({
        isAnonymous: false,
        email: newUser.email,
        name: newUser.name,
        emailVerified: newUser.emailVerified,
        image: newUser.image,
      })
      .where(eq(user.id, anonymousUserId));
  });
}
