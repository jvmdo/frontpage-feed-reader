import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { parseFeedXml } from "@/lib/feed/parser";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Dashboard Feed", () => {
  test("renders items from real-world feed fixtures", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Read and parse fixtures
    const atomXml = fs.readFileSync(
      path.join(__dirname, "fixtures", "atom-1.xml"),
      "utf-8",
    );
    const rssXml = fs.readFileSync(
      path.join(__dirname, "fixtures", "rss-2.xml"),
      "utf-8",
    );

    const atomFeedData = await parseFeedXml(atomXml, "https://vercel.com/atom");
    const rssFeedData = await parseFeedXml(
      rssXml,
      "https://css-tricks.com/feed",
    );

    // 2. Seed Feeds and Subscriptions
    const { feed: atomFeed } = await seedFeedWithSubscription(db, userId, {
      url: `https://vercel.com/atom?tenant=${userId}`,
      title: atomFeedData.metadata.title,
      iconUrl: "https://vercel.com/favicon.ico",
    });

    const { feed: rssFeed } = await seedFeedWithSubscription(db, userId, {
      url: `https://css-tricks.com/feed?tenant=${userId}`,
      title: rssFeedData.metadata.title,
      iconUrl: "https://css-tricks.com/favicon.ico",
    });

    // 3. Seed Feed Items
    await seedFeedItems(
      db,
      atomFeed.id,
      atomFeedData.items.map((item) => ({
        ...item,
        guid: `${item.guid}-${userId}`, // Make GUID unique for this test run
      })),
    );

    await seedFeedItems(
      db,
      rssFeed.id,
      rssFeedData.items.map((item) => ({
        ...item,
        guid: `${item.guid}-${userId}`,
      })),
    );

    // 4. Navigate to Dashboard
    await page.goto("/dashboard");

    // 5. Verify items from both feeds are visible using semantic roles
    // From Atom feed
    await expect(
      page.getByRole("link", { name: /Optimizing Vercel Sandbox snapshots/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Standard Atom 1.0 Feed").first(),
    ).toBeVisible();

    // From RSS feed
    await expect(
      page.getByRole("link", {
        name: /Making Complex CSS Shapes Using shape\(\)/i,
      }),
    ).toBeVisible();
    await expect(page.getByText("Standard RSS 2.0 Feed").first()).toBeVisible();

    // 6. Verify sorting (RSS feed items are dated 2026 in the fixture, Atom are 2024)
    // So RSS items should be at the top. We check the first heading in an article.
    const firstArticleHeading = page
      .getByRole("article")
      .first()
      .getByRole("heading", { level: 3 });
    await expect(firstArticleHeading).toHaveText(
      /Making Complex CSS Shapes Using shape\(\)/i,
    );
  });

  test("shows empty state when no subscriptions exist", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    await page.goto("/dashboard");

    // Verify empty state with semantic heading level
    await expect(
      page.getByRole("heading", { level: 2, name: /your feed is empty/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/subscribe to more feeds or refresh your current ones/i),
    ).toBeVisible();
  });
});
