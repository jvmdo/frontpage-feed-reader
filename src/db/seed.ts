import { type DB, db } from "@/db";
import { feeds } from "@/db/schema";
import sampleFeeds from "../../data/sample-feeds.json";

/**
 * Seeds the global curated feeds and their items used by the 'Try as Guest' experience.
 *
 * @param tx - Optional database instance (for testing). Defaults to global db.
 */
export async function seed(tx: DB = db) {
  console.log("🌱 Seeding curated feeds...");

  // 1. Bulk Seed Metadata
  const allFeeds = sampleFeeds.categories.flatMap((c) =>
    c.feeds.map((f) => ({
      url: f.feedUrl,
      title: f.title,
      description: f.description,
    })),
  );

  await tx.insert(feeds).values(allFeeds).onConflictDoNothing();

  console.log("✅ Seeding complete.");
}

// Only auto-run if this script is executed directly (not imported for tests)
if (import.meta.url.endsWith(process.argv[1])) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
