import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { type DB, db } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { parseFeedXml } from "@/lib/feed/parser";
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
  const allFeeds = [
    {
      url: WELCOME_FEED_URL,
      title: "Frontpage",
      description: "Welcome to your new favorite way to read the web.",
      isCurated: true,
    },
    ...sampleFeeds.categories.flatMap((c) =>
      c.feeds.map((f) => ({
        url: f.feedUrl,
        title: f.title,
        description: f.description,
        isCurated: true,
      })),
    ),
  ];

  await tx.insert(feeds).values(allFeeds).onConflictDoNothing();

  // 2. Resolve Database Records
  const insertedFeeds = await tx.query.feeds.findMany({
    where: inArray(
      feeds.url,
      allFeeds.map((f) => f.url),
    ),
  });

  // 3. Seed welcome feed items locally (avoiding loopback HTTP call)
  const welcomeFeed = insertedFeeds.find((f) => f.url === WELCOME_FEED_URL);
  if (welcomeFeed) {
    console.log("📝 Seeding welcome feed items locally...");
    try {
      const filePath = path.join(process.cwd(), "data", "welcome-feed.xml");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const now = new Date().toUTCString();
        const origin = WELCOME_FEED_URL.replace("/feed.xml", "");
        const xml = content
          .replaceAll("{{NOW}}", now)
          .replaceAll("http://localhost:3000", origin);

        const { items } = await parseFeedXml(xml, WELCOME_FEED_URL);
        if (items.length > 0) {
          await tx
            .insert(feedItems)
            .values(items.map((item) => ({ ...item, feedId: welcomeFeed.id })))
            .onConflictDoNothing();
          console.log(`✅ Seeded ${items.length} items for the welcome feed.`);
        }

        // Set the welcome feed status to healthy and set fetch timestamps
        await tx
          .update(feeds)
          .set({
            healthStatus: "healthy",
            lastFetchedAt: new Date(),
            lastSuccessAt: new Date(),
            lastFailureAt: null,
          })
          .where(eq(feeds.id, welcomeFeed.id));
      } else {
        console.warn(`⚠️ Welcome feed template not found at ${filePath}`);
      }
    } catch (err) {
      console.error("❌ Failed to seed welcome feed items:", err);
    }
  }

  // 4. Resilient Pre-warming for remote feeds
  console.log("🔥 Pre-warming curated feeds...");
  const feedsToWarm = insertedFeeds.filter((f) => f.url !== WELCOME_FEED_URL);

  const results = await Promise.allSettled(
    feedsToWarm.map((feed) => ingestItems(tx, feed.id)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failedResults = results
    .map((r, i) =>
      r.status === "rejected"
        ? { url: feedsToWarm[i].url, error: r.reason }
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
