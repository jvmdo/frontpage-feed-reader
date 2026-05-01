import { db } from "@/db";
import { seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("clicking 'Refresh' in FeedToolbar triggers ingestion and updates UI", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed that points to a local fixture
  const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

  const { feed } = await seedFeedWithSubscription(db, userId, {
    url: feedUrl,
    title: "Toolbar Refresh Test",
    healthStatus: "unknown",
  });

  // 1. Navigate to the Dashboard for this specific feed
  await page.goto(`/dashboard?feedId=${feed.id}`);

  // 2. Wait for hydration (as per project conventions)
  await page.waitForSelector('body[data-hydrated="true"]');

  // 3. Verify toolbar shows the correct title
  await expect(page.getByRole("heading", { name: "Toolbar Refresh Test" })).toBeVisible();

  // 4. Trigger Refresh from the toolbar
  const refreshButton = page.getByRole("button", { name: /refresh/i });
  
  await expect(refreshButton).toBeVisible();
  await refreshButton.click();

  // 5. Verify operation succeeded
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /feed refreshed/i,
  );
  await expect(refreshButton).not.toBeDisabled();
});
