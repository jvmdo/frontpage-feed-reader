import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import { feeds, user } from "@/db/schema";
import { auth } from "@/lib/auth";

/**
 * Clean up a test user and their data by their email address.
 */
export async function cleanupUserByEmail(email: string) {
  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (dbUser) {
    await cleanupUser(dbUser.id);
  }
}

/**
 * Manually trigger the teardown logic for a specific test user.
 * Useful for cleaning up after manual Playwright MCP sessions or crashed tests.
 */
export async function cleanupUser(userId: string) {
  try {
    const { test: authTest } = await auth.$context;

    // 1. Delete user from Auth provider
    // This triggers DB-level ON DELETE CASCADE for:
    // - categories
    // - subscriptions
    // - user_item_states
    // - user_preferences
    // - sessions/accounts
    await authTest.deleteUser(userId);

    // 2. Delete tenant-specific feeds
    // These are shared entities not tied to the user by FK, so they need explicit deletion.
    // Deleting the feed also cascades to its feed_items.
    const deletedFeeds = await db
      .delete(feeds)
      .where(like(feeds.url, `%tenant=${userId}%`))
      .returning({ id: feeds.id, url: feeds.url });

    if (deletedFeeds.length > 0) {
    } else {
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// Only run automatically if executed directly via CLI
if (process.versions.bun) {
  const userId = process.argv[2];

  if (!userId) {
    console.error("\n❌ Error: No userId provided.");
    process.exit(1);
  }

  cleanupUser(userId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
