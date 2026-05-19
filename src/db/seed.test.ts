import { eq } from "drizzle-orm";
import { feeds } from "@/db/schema";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../data/sample-feeds.json";
import { seed } from "./seed";

describe("db:seed integration", () => {
  const TOTAL_EXPECTED_FEEDS = sampleFeeds.categories.reduce(
    (acc, cat) => acc + cat.feeds.length,
    0,
  );

  test("successfully seeds all curated feeds", async ({ tx }) => {
    // 1. Act
    await seed(tx);

    // 2. Assert: Metadata
    const dbFeeds = await tx.select().from(feeds);
    expect(dbFeeds).toHaveLength(TOTAL_EXPECTED_FEEDS);
  });

  test("is idempotent and handles conflicts by doing nothing", async ({
    tx,
  }) => {
    // 1. Seed once
    await seed(tx);
    const initialFeeds = await tx.select().from(feeds);

    const firstSampleFeed = sampleFeeds.categories[0].feeds[0];

    // 2. Modify one feed title to verify onConflictDoNothing
    await tx
      .update(feeds)
      .set({ title: "MODIFIED_TITLE" })
      .where(eq(feeds.url, firstSampleFeed.feedUrl));

    // 3. Seed again
    await seed(tx);

    // 4. Assert: No new rows, and title was NOT overwritten back
    const finalFeeds = await tx.select().from(feeds);
    expect(finalFeeds).toHaveLength(initialFeeds.length);

    const checkFeed = await tx.query.feeds.findFirst({
      where: eq(feeds.url, firstSampleFeed.feedUrl),
    });

    expect(checkFeed?.title).toBe("MODIFIED_TITLE");
  });
});
