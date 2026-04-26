import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

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
  const articleCard = page
    .locator("article")
    .filter({ hasText: /Test Article For Reader/i });

  // Initial state: should be unread
  await expect(articleCard).toContainText(/\bunread\b/i);

  await articleCard.click();

  // 4. Verify URL updates (confirms click registered)
  await expect(page).toHaveURL(new RegExp(`itemId=${item.id}`), {
    timeout: 10000,
  });

  // 5. Verify it's marked as read in the UI
  await expect(articleCard).not.toContainText(/\bunread\b/i);
  // The unread dot indicator should be gone
  await expect(articleCard.locator(".bg-unread-indicator")).not.toBeVisible();

  // 6. Verify Sheet slides in
  // Note: There might be multiple dialogs (Add Feed, Reader), but Reader should be visible
  const sheet = page.getByRole("dialog").filter({ visible: true });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("heading", { name: "Test Article For Reader" }),
  ).toBeVisible();

  await expect(
    sheet.locator("header").getByText("Reader Test Feed", { exact: true }),
  ).toBeVisible();

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
  await page.waitForLoadState("networkidle");

  // Find the specific "Add Feed" button in the sidebar
  const sidebar = page.locator('[data-slot="sidebar"]');
  // Use force: true to ensure it clicks even if webkit thinks something is overlapping
  await sidebar.getByRole("button", { name: /add feed/i }).click({ force: true });

  // Wait for the dialog to be visible, using the title to be sure it's the right one
  const dialog = page.getByRole("dialog", { name: /add feed/i }).filter({ visible: true });
  await expect(dialog).toBeVisible();

  const input = dialog.getByRole("textbox", { name: /feed url/i });
  await input.fill(maliciousFeedUrl);
  await dialog.getByRole("button", { name: /add feed/i, exact: true }).click();

  // 2. Wait for success and dialog to close
  const toast = page.locator("[data-sonner-toast]");
  await expect(toast).toContainText("Feed added successfully");
  await expect(dialog).not.toBeVisible();

  // 3. Find and open the malicious article
  const articleCard = page
    .locator("article")
    .filter({ hasText: /XSS Article/i });
  await articleCard.click();

  // 4. Verify content is rendered but scripts didn't execute
  const sheet = page.getByRole("dialog").filter({ visible: true });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Malicious content.")).toBeVisible();

  // Check that the onerror handler didn't set our global flag
  const xssExecuted = await page.evaluate(() => (window as any).XSS_EXECUTED);
  expect(xssExecuted).toBeUndefined();

  // Also check that script tag itself is not in the DOM
  const scriptCount = await sheet.locator("script").count();
  expect(scriptCount).toBe(0);
});

test("persistence: opening direct URL with itemId", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  const { feed } = await seedFeedWithSubscription(db, userId);
  const [item] = await seedFeedItems(db, feed.id, [
    { title: "Direct Article" },
  ]);

  // Go directly to the URL with itemId
  await page.goto(`/dashboard?itemId=${item.id}`);

  // Verify reader is open immediately
  const sheet = page.getByRole("dialog").filter({ visible: true });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Direct Article")).toBeVisible();
});
