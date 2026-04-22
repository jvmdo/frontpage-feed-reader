import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Reader View", () => {
  test("full flow: open article, read, and dismiss", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Seed a feed with an item
    const { feed } = await seedFeedWithSubscription(db, userId, {
      title: "Reader Test Feed",
    });

    const [item] = await seedFeedItems(db, feed.id, [
      {
        title: "Test Article For Reader",
        url: "https://example.com/test-article",
        content: "<p>This is the test content for the reader view.</p>",
        publishedAt: new Date(),
      },
    ]);

    // 2. Navigate to dashboard
    await page.goto("/dashboard");

    // Ensure the page is hydrated and ready for interaction
    await page.waitForLoadState("networkidle");

    // 3. Find and click the article card
    const articleCard = page.getByRole("article", {
      name: /Test Article For Reader/i,
    });
    
    // Initial state: should be unread
    await expect(articleCard.getByRole("button", { name: /unread/i })).toBeVisible();
    
    await articleCard.click();

    // 4. Verify URL updates (confirms click registered)
    await expect(page).toHaveURL(new RegExp(`itemId=${item.id}`), {
      timeout: 10000,
    });

    // 5. Verify it's marked as read in the UI
    // The "Unread:" prefix should be gone from the accessible name
    await expect(articleCard.getByRole("button", { name: /unread/i })).not.toBeVisible();
    // The unread dot indicator should be gone
    await expect(articleCard.locator(".bg-unread-indicator")).not.toBeVisible();

    // 6. Verify Sheet slides in
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Test Article For Reader")).toBeVisible();
    await expect(sheet.getByText("Reader Test Feed")).toBeVisible();
    await expect(
      sheet.getByText("This is the test content for the reader view."),
    ).toBeVisible();

    // 6. Dismiss the reader
    await page.keyboard.press("Escape");

    // 7. Verify reader is closed and URL is cleared
    await expect(sheet).not.toBeVisible();
    await expect(page).not.toHaveURL(/itemId=/);
  });

  test("security: backend sanitizes malicious feeds before rendering", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const maliciousFeedUrl = `http://localhost:3432/malicious-feed.xml?tenant=${userId}`;

    // 1. Add the malicious feed via UI
    await page.goto("/dashboard");
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add feed/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/feed url/i).fill(maliciousFeedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // 2. Wait for success and dialog to close
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toContainText("Feed added successfully");
    await expect(dialog).not.toBeVisible();

    // 3. Find and open the malicious article
    const articleCard = page.getByRole("article", { name: /XSS Article/i });
    await articleCard.click();

    // 4. Verify content is rendered but scripts didn't execute
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Malicious content.")).toBeVisible();

    // Check that the onerror handler didn't set our global flag
    const xssExecuted = await page.evaluate(() => (window as any).XSS_EXECUTED);
    expect(xssExecuted).toBeUndefined();

    // Also check that script tag itself is not in the DOM
    const scriptCount = await sheet.locator("script").count();
    expect(scriptCount).toBe(0);
  });

  test("persistence: opening direct URL with itemId", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    const { feed } = await seedFeedWithSubscription(db, userId);
    const [item] = await seedFeedItems(db, feed.id, [
      { title: "Direct Article" },
    ]);

    // Go directly to the URL with itemId
    await page.goto(`/dashboard?itemId=${item.id}`);

    // Verify reader is open immediately
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Direct Article")).toBeVisible();
  });
});
