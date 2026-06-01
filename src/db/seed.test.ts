import { eq } from "drizzle-orm";
import { feeds } from "@/db/schema";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../data/sample-feeds.json";
import { seed } from "./seed";

vi.mock("@/services/ingestion/feed-ingestion");

describe("db:seed integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(ingestItems).mockResolvedValue({
      success: true,
      status: "fetched",
    });
  });

  const TOTAL_EXPECTED_FEEDS =
    sampleFeeds.categories.reduce((acc, cat) => acc + cat.feeds.length, 0) + 1; // Welcome Feed

  test("successfully seeds all curated feeds", { timeout: 20000 }, async ({
    tx,
  }) => {
    // 1. Act
    await seed(tx);

    // 2. Assert: Metadata
    const dbFeeds = await tx.select().from(feeds);
    expect(dbFeeds).toHaveLength(TOTAL_EXPECTED_FEEDS);

    // Verify isCurated is set
    expect(dbFeeds.every((f) => f.isCurated)).toBe(true);
  });

  test("is idempotent and handles conflicts by doing nothing", {
    timeout: 20000,
  }, async ({ tx }) => {
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
