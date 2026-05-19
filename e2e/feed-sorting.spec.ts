import { subMinutes } from "date-fns";
import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Feed Item Sorting", () => {
  test("renders items in the correct order based on explicit UI selection", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const now = new Date();

    // 1. Setup: Create a feed with items published at distinct times
    const { feed } = await seedFeedWithSubscription(db, userId);

    await seedItems(db, feed.id, [
      { title: "Oldest Item", publishedAt: subMinutes(now, 20) },
      { title: "Middle Item", publishedAt: subMinutes(now, 10) },
      { title: "Newest Item", publishedAt: now },
    ]);

    // 2. Navigate to dashboard (default is newest published)
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Verify Default Sorting (Newest Published First)
    let articles = page.locator("article");
    await expect(articles).toHaveCount(3);
    await expect(articles.nth(0)).toContainText("Newest Item");
    await expect(articles.nth(1)).toContainText("Middle Item");
    await expect(articles.nth(2)).toContainText("Oldest Item");

    // 4. Change Sort to Oldest
    await page.getByRole("button", { name: "Newest", exact: true }).click();
    await page
      .getByRole("menuitemradio", { name: "Oldest", exact: true })
      .click();

    // Wait for network response to complete after sorting changes

    // 5. Verify Updated Sorting (Oldest Published First)
    articles = page.locator("article");
    await expect(articles.nth(0)).toContainText("Oldest Item");
    await expect(articles.nth(1)).toContainText("Middle Item");
    await expect(articles.nth(2)).toContainText("Newest Item");
  });

  test("Saved view offers expanded sorting and defaults to recently saved", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const now = new Date();

    // 1. Setup: Create a feed and items
    const { feed } = await seedFeedWithSubscription(db, userId);

    await seedItems(db, feed.id, [
      { title: "First Published (Oldest)", publishedAt: subMinutes(now, 20) },
      { title: "Second Published (Newest)", publishedAt: now },
    ]);

    // 2. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // Bookmark the oldest published item FIRST
    const article1 = page
      .locator("article")
      .filter({ hasText: "First Published" });
    await article1.getByRole("button", { name: /save for later/i }).click();

    // Wait a brief moment to ensure bookmark timestamps differ
    await page.waitForTimeout(500);

    // Bookmark the newest published item SECOND
    const article2 = page
      .locator("article")
      .filter({ hasText: "Second Published" });
    await article2.getByRole("button", { name: /save for later/i }).click();

    // 3. Switch to Saved View
    await page.getByRole("link", { name: "Saved" }).click();

    // 4. Verify Default Saved Sorting (Recently Saved First)
    // The "Second Published" item was saved MOST RECENTLY, so it should be at the top
    let articles = page.locator("article");
    await expect(articles.nth(0)).toContainText("Second Published");
    await expect(articles.nth(1)).toContainText("First Published");

    // Check that the dropdown button reflects the active state
    await expect(
      page.getByRole("button", { name: "Recently Saved" }),
    ).toBeVisible();

    // 5. Change to "Oldest Published" in Saved View
    await page.getByRole("button", { name: "Recently Saved" }).click();
    await page.getByRole("menuitemradio", { name: "Oldest Published" }).click();
    await expect(page).toHaveURL(/sortOrder=asc/);
    await expect(page).toHaveURL(/sortBy=publishedAt/);

    // 6. Verify Sorting explicitly by Publish Date
    articles = page.locator("article");
    await expect(articles.nth(0)).toContainText("First Published");
    await expect(articles.nth(1)).toContainText("Second Published");
  });

  test("clears sorting parameters from URL when returning to default", async ({
    authedPage,
  }) => {
    const { page } = authedPage;
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 1. Set to non-default (Oldest)
    await page.getByRole("button", { name: "Newest", exact: true }).click();
    await page
      .getByRole("menuitemradio", { name: "Oldest", exact: true })
      .click();
    await expect(page).toHaveURL(/sortOrder=asc/);

    // 2. Return to default (Newest)
    await page.getByRole("button", { name: "Oldest", exact: true }).click();
    await page
      .getByRole("menuitemradio", { name: "Newest", exact: true })
      .click();

    // 3. Assert URL is clean
    await expect(page).not.toHaveURL(/sortOrder=/);
    await expect(page).not.toHaveURL(/sortBy=/);
  });

  test("clears sorting parameters from URL when returning to default in Saved view", async ({
    authedPage,
  }) => {
    const { page } = authedPage;
    await page.goto("/dashboard?saved=true");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 1. Set to non-default in Saved view (Oldest Published)
    await page
      .getByRole("button", { name: "Recently Saved", exact: true })
      .click();
    await page
      .getByRole("menuitemradio", { name: "Oldest Published", exact: true })
      .click();
    await expect(page).toHaveURL(/sortBy=publishedAt/);
    await expect(page).toHaveURL(/sortOrder=asc/);

    // 2. Return to default (Recently Saved)
    await page
      .getByRole("button", { name: "Oldest Published", exact: true })
      .click();
    await page
      .getByRole("menuitemradio", { name: "Recently Saved", exact: true })
      .click();

    // 3. Assert URL only contains 'saved=true'
    await expect(page).toHaveURL(/\/dashboard\?saved=true$/);
    await expect(page).not.toHaveURL(/sortBy=/);
    await expect(page).not.toHaveURL(/sortOrder=/);
  });
});
