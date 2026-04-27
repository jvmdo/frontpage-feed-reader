import { db } from "@/db";
import { seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("clicking 'Refresh' triggers ingestion and updates UI", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed that points to a local fixture
  const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

  await seedFeedWithSubscription(db, userId, {
    url: feedUrl,
    title: "Original Title",
    healthStatus: "unknown",
    // No lastSuccessAt yet
  });

  // 1. Navigate to Manage Feeds
  await page.goto("/manage-feeds");

  // 2. Verify initial state
  const table = page.getByRole("table");

  await expect(table.getByText("Original Title")).toBeVisible();
  await expect(table.getByText("Never")).toBeVisible();

  // 3. Trigger Refresh
  await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("menuitem", { name: /refresh/i }).click();

  // 4. Verify operation succeeded
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /feed refreshed/i,
  );
  await expect(table.getByText(/just now/i)).toBeVisible();
  await expect(table.getByText("Standard RSS 2.0 Feed")).toBeVisible();
});
