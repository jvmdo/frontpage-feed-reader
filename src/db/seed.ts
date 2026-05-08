import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type DB, db } from "@/db";
import { feedItems, feeds } from "@/db/schema";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { parseFeedXml } from "@/lib/feed/parser";
import sampleFeeds from "../../data/sample-feeds.json";

/**
 * Seeds the global curated feeds and their items used by the 'Try as Guest' experience.
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
    },
    ...sampleFeeds.categories.flatMap((c) =>
      c.feeds.map((f) => ({
        url: f.feedUrl,
        title: f.title,
        description: f.description,
      })),
    ),
  ];

  await tx.insert(feeds).values(allFeeds).onConflictDoNothing();

  // 2. Seed "Frontpage" Items
  const feed = await tx.query.feeds.findFirst({
    where: (feeds, { eq }) => eq(feeds.url, WELCOME_FEED_URL),
  });

  if (feed) {
    const publicPath = join(process.cwd(), "public", "feed.xml");
    const xml = readFileSync(publicPath, "utf-8");
    const { items } = await parseFeedXml(xml, WELCOME_FEED_URL);

    if (items.length > 0) {
      await tx
        .insert(feedItems)
        .values(items.map((item) => ({ ...item, feedId: feed.id })))
        .onConflictDoNothing();
    }
  }

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
