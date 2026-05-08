import { eq } from "drizzle-orm";
import { feedItems, feeds } from "@/db/schema";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../data/sample-feeds.json";
import { seed } from "./seed";

describe("db:seed integration", () => {
  const TOTAL_EXPECTED_FEEDS =
    1 + // Welcome feed
    sampleFeeds.categories.reduce((acc, cat) => acc + cat.feeds.length, 0);

  test("successfully seeds all curated feeds and welcome items", async ({
    tx,
  }) => {
    // 1. Act
    await seed(tx);

    // 2. Assert: Metadata
    const dbFeeds = await tx.select().from(feeds);
    expect(dbFeeds).toHaveLength(TOTAL_EXPECTED_FEEDS);

    const welcomeFeed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, WELCOME_FEED_URL),
    });

    if (!welcomeFeed) {
      throw new Error("Welcome feed was not seeded correctly");
    }

    expect(welcomeFeed.title).toBe("Frontpage");

    // 3. Assert: Items for welcome feed
    const items = await tx
      .select()
      .from(feedItems)
      .where(eq(feedItems.feedId, welcomeFeed.id));

    expect(items.length).toBeGreaterThan(0);
  });

  test("is idempotent and handles conflicts by doing nothing", async ({
    tx,
  }) => {
    // 1. Seed once
    await seed(tx);
    const initialFeeds = await tx.select().from(feeds);
    const initialItems = await tx.select().from(feedItems);

    // 2. Modify one feed title to verify onConflictDoNothing
    await tx
      .update(feeds)
      .set({ title: "MODIFIED_TITLE" })
      .where(eq(feeds.url, WELCOME_FEED_URL));

    // 3. Seed again
    await seed(tx);

    // 4. Assert: No new rows, and title was NOT overwritten back to "Frontpage"
    const finalFeeds = await tx.select().from(feeds);
    const finalItems = await tx.select().from(feedItems);

    expect(finalFeeds).toHaveLength(initialFeeds.length);
    expect(finalItems).toHaveLength(initialItems.length);

    const welcomeFeed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, WELCOME_FEED_URL),
    });

    if (!welcomeFeed) {
      throw new Error("Welcome feed missing after second seed");
    }

    expect(welcomeFeed.title).toBe("MODIFIED_TITLE");
  });
});
