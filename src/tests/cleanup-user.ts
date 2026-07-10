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
  console.log(`\n🧹 Starting cleanup for user: ${userId}...`);

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
    console.log(`✅ Deleted user ${userId} (and all cascaded records).`);

    // 2. Delete tenant-specific feeds
    // These are shared entities not tied to the user by FK, so they need explicit deletion.
    // Deleting the feed also cascades to its feed_items.
    const deletedFeeds = await db
      .delete(feeds)
      .where(like(feeds.url, `%tenant=${userId}%`))
      .returning({ id: feeds.id, url: feeds.url });

    if (deletedFeeds.length > 0) {
      console.log(`✅ Deleted ${deletedFeeds.length} tenant-specific feeds.`);
    } else {
      console.log("ℹ️ No tenant-specific feeds found to delete.");
    }

    console.log("✨ Cleanup complete.\n");
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
    console.log("Usage: bun run src/tests/cleanup-user.ts <userId>\n");
    process.exit(1);
  }

  cleanupUser(userId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
