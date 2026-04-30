import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { parseFeedXml } from "@/lib/feed/parser";
import { seedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("renders items from real-world feed fixtures", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Read and parse fixtures
  const atomXml = fs.readFileSync(
    path.join(__dirname, "fixtures", "atom-1.xml"),
    "utf-8",
  );
  const rssXml = fs.readFileSync(
    path.join(__dirname, "fixtures", "rss-2.xml"),
    "utf-8",
  );

  const atomFeedData = await parseFeedXml(atomXml, "https://vercel.com/atom");
  const rssFeedData = await parseFeedXml(rssXml, "https://css-tricks.com/feed");

  // Seed Feeds and Subscriptions
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

  // Seed Feed Items
  await seedItems(
    db,
    atomFeed.id,
    atomFeedData.items.map((item) => ({
      ...item,
      guid: `${item.guid}-${userId}`, // Make GUID unique for this test run
    })),
  );

  await seedItems(
    db,
    rssFeed.id,
    rssFeedData.items.map((item) => ({
      ...item,
      guid: `${item.guid}-${userId}`,
    })),
  );

  // 1. Navigate to the dashboard
  // No need to explicitly wait for hydration because there's no user interactions in this test
  await page.goto("/dashboard");

  const sidebar = page.locator('[data-slot="sidebar"]');
  const main = page.getByRole("main");

  // 2. Verify items from both feeds are visible

  // From RSS feed
  await expect(
    sidebar.getByRole("link", { name: /standard rss/i }),
  ).toBeVisible();
  await expect(
    main.getByRole("article", { name: /making complex css/i }),
  ).toBeVisible();

  // From Atom feed
  await expect(
    sidebar.getByRole("link", { name: /standard atom/i }),
  ).toBeVisible();

  // Scroll to bottom to ensure Atom items (older) are rendered by Virtuoso
  await page.evaluate(() => {
    const container = document.getElementById("feed-container");
    if (container) container.scrollTo(0, container.scrollHeight);
  });

  await expect(
    main.getByRole("article", { name: /optimizing vercel sandbox/i }),
  ).toBeVisible();

  // Scroll back to top to ensure RSS items (newer) are rendered again
  await page.evaluate(() => {
    const container = document.getElementById("feed-container");
    if (container) container.scrollTo(0, 0);
  });

  // 3. Verify sorting (RSS feed items are dated 2026 in the fixture, Atom are 2024)
  // So RSS items should be at the top. We check the first heading in an article.
  const firstArticleHeading = main.getByRole("article").first();

  await expect(firstArticleHeading).toHaveText(/making complex css/i);
});

test("shows empty state when no subscriptions exist", async ({
  authedPage,
}) => {
  const { page } = authedPage;

  // 1. Navigate to the dashboard and wait for hydration
  // No need to wait for hydration because there's no JS interaction in this test
  await page.goto("/dashboard");

  // 2. Verify empty state is visible in the main feed section
  await expect(
    page.getByRole("main").getByText(/your feed is empty/i),
  ).toBeVisible();
});
