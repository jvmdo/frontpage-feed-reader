import { inArray } from "drizzle-orm";
import { type DB, db } from "@/db";
import { feeds } from "@/db/schema";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import sampleFeeds from "../../data/sample-feeds.json";

/**
 * Seeds the curated list of feeds used by the 'Try as Guest' experience.
 * Performs resilient pre-warming by fetching live items from the web.
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
      isCurated: true,
    })),
  );

  await tx.insert(feeds).values(allFeeds).onConflictDoNothing();

  // 2. Resilient Pre-warming
  console.log("🔥 Pre-warming curated feeds...");
  const insertedFeeds = await tx.query.feeds.findMany({
    where: inArray(
      feeds.url,
      allFeeds.map((f) => f.url),
    ),
  });

  const results = await Promise.allSettled(
    insertedFeeds.map((feed) => ingestItems(tx, feed.id)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failedResults = results
    .map((r, i) =>
      r.status === "rejected"
        ? { url: insertedFeeds[i].url, error: r.reason }
        : null,
    )
    .filter((r): r is { url: string; error: any } => r !== null);

  console.log(
    `✅ Seeding complete. Pre-warmed ${succeeded} feeds (${failedResults.length} failed).`,
  );

  if (failedResults.length > 0) {
    console.warn("\n⚠️ The following feeds failed to pre-warm:");
    for (const { url, error } of failedResults) {
      console.warn(
        `  - ${url}: ${error instanceof Error ? error.message : error}`,
      );
    }
    console.warn(
      "\nNote: These feeds will be automatically retried by the background worker once the app is live.\n",
    );
  }
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
