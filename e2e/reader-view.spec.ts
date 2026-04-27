import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("open article, read its content, and dismiss", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with an item
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

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");

  const article = page.getByRole("article", {
    name: /test article for reader/i,
  });

  await expect(article).toBeVisible();

  // 2. Click the article card and verify URL updates (confirms click registered)
  await article.click();

  await expect(page).toHaveURL(new RegExp(`itemId=${item.id}`));

  // 3. Verify Sheet slides in
  const sheet = page.getByRole("dialog", { name: /article reader/i });

  await expect(sheet).toBeVisible();

  // 5. Verify article content is visible
  await expect(
    sheet.getByRole("heading", { name: "Test Article For Reader" }),
  ).toBeVisible();

  await expect(
    sheet.locator("header").getByText("Reader Test Feed"),
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

test("navigation between articles and read status tracking", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with multiple items
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Nav Test Feed",
  });

  const now = new Date();
  await seedFeedItems(db, feed.id, [
    {
      title: "Article 1 (Newest)",
      publishedAt: new Date(now.getTime() - 1000),
    },
    {
      title: "Article 2 (Middle)",
      publishedAt: new Date(now.getTime() - 2000),
    },
    {
      title: "Article 3 (Oldest)",
      publishedAt: new Date(now.getTime() - 3000),
    },
  ]);

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await expect(page.getByRole("article", { name: /article 1/i })).toBeVisible();

  const main = page.getByRole("main");

  // 2. Verify all are unread initially
  // Using locator because a11y tree is unreachable when modal is later opened
  const items = main.locator("article", { hasText: /article \d/i });
  const count = await items.count();

  for (let i = 0; i < count; i++) {
    await expect(items.nth(i)).toContainText(/\bunread\b/i);
  }

  // 3. Open the first article. Article 1 should now be read.
  await items.nth(0).click();
  await expect(items.nth(0)).toContainText(/\bread\b/i);

  // 4. Navigate to Next (Article 2) via Button
  const sheet = page.getByRole("dialog", { name: /article reader/i });

  await sheet.getByRole("button", { name: /next article/i }).click();

  // Verify Article 2 is now marked read in dashboard
  await expect(
    sheet.getByRole("heading", { name: /article 2/i }),
  ).toBeVisible();

  await expect(items.nth(1)).toContainText(/\bread\b/i);

  // 5. Navigate to Next (Article 3) via Keyboard 'j'
  await page.keyboard.press("j");

  // Verify Article 3 is now marked read in dashboard
  await expect(
    sheet.getByRole("heading", { name: /article 3/i }),
  ).toBeVisible();

  await expect(items.nth(2)).toContainText(/\bread\b/i);
});

test("malicious feeds are sanitized before rendering", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;
  const maliciousFeedUrl = `http://localhost:3432/malicious-feed.xml?tenant=${userId}`;

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  const sidebar = page.locator('[data-slot="sidebar"]');
  const dialog = page.getByRole("dialog", { name: /add feed/i });
  const sheet = page.getByRole("dialog", { name: /article reader/i });

  // 2. Open the dialog and fill in the form
  await sidebar.getByRole("button", { name: /add feed/i }).click();

  await dialog
    .getByRole("textbox", { name: /feed url/i })
    .fill(maliciousFeedUrl);
  await dialog.getByRole("button", { name: /add feed/i, exact: true }).click();

  // 3. Verify success and dialog to close
  const toast = page.locator("[data-sonner-toast]");

  await expect(toast).toContainText("Feed added successfully");
  await expect(dialog).not.toBeVisible();

  // 5. Open the malicious article
  await page.getByRole("article", { name: /XSS Article/i }).click();

  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Malicious content.")).toBeVisible();

  // Check that the onerror handler didn't set our global flag
  const xssExecuted = await page.evaluate(() => (window as any).XSS_EXECUTED);
  expect(xssExecuted).toBeUndefined();

  // Also check that script tag itself is not in the DOM
  const scriptCount = await sheet.locator("script").count();
  expect(scriptCount).toBe(0);
});

test("opening direct URL with itemId", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  const { feed } = await seedFeedWithSubscription(db, userId);
  const [item] = await seedFeedItems(db, feed.id, [
    { title: "Direct Article" },
  ]);

  // 1. Go directly to the URL with itemId
  await page.goto(`/dashboard?itemId=${item.id}`);

  // 2.Verify reader is open immediately
  const sheet = page.getByRole("dialog", { name: /article reader/i });

  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Direct Article")).toBeVisible();
});
