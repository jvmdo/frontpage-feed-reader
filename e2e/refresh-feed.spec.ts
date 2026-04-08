import { db } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { expect, test } from "./fixtures/test-extend";

test.describe("Refresh Feed", () => {
  test("clicking 'Refresh' triggers ingestion and updates UI", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a feed that points to a local fixture
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

    const [feed] = await db
      .insert(feeds)
      .values({
        url: feedUrl,
        title: "Original Title",
        healthStatus: "unknown",
        // No lastSuccessAt yet
      })
      .returning();

    await db.insert(subscriptions).values({
      userId: userId,
      feedId: feed.id,
    });

    // 2. Navigate to Manage Feeds
    await page.goto("/manage-feeds");

    // 3. Verify initial state
    const table = page.getByRole("table");
    await expect(table.getByText("Original Title")).toBeVisible();
    await expect(table.getByText("Never")).toBeVisible();

    // 4. Trigger Refresh
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("menuitem", { name: /refresh/i }).click();

    // 5. Verify success toast
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toContainText(/feed refreshed/i);

    // 6. Verify UI updates
    // The title should update from the RSS content ("Standard RSS 2.0 Feed")
    await expect(table.getByText("Standard RSS 2.0 Feed")).toBeVisible();
    // The "Last Fetched" should update to "just now"
    await expect(table.getByText(/just now/i)).toBeVisible();
  });
});
