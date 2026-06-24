import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("open item, read its content, and dismiss", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with an item
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Reader Test Feed",
  });

  const [item] = await seedItems(db, feed.id, [
    {
      title: "Test Item For Reader",
      url: "https://example.com/test-item",
      content: "<p>This is the test content for the reader view.</p>",
      publishedAt: new Date(),
    },
  ]);

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");

  const itemCard = page.getByRole("article", {
    name: /test item for reader/i,
  });

  await expect(itemCard).toBeVisible();

  // 2. Click the item card and verify URL updates (confirms click registered)
  await itemCard.click();

  await expect(page).toHaveURL(new RegExp(`itemId=${item.id}`));

  // 3. Verify dialog shows up
  const lightbox = page.getByRole("dialog", { name: /item reader/i });

  await expect(lightbox).toBeVisible();

  // 5. Verify item content is visible
  await expect(
    lightbox.getByRole("heading", { name: "Test Item For Reader" }),
  ).toBeVisible();

  await expect(
    lightbox.locator("header").getByText("Reader Test Feed"),
  ).toBeVisible();

  await expect(
    lightbox.getByText("This is the test content for the reader view."),
  ).toBeVisible();

  // 6. Dismiss the reader
  await page.keyboard.press("Escape");

  // 7. Verify reader is closed and URL is cleared
  await expect(lightbox).not.toBeVisible();
  await expect(page).not.toHaveURL(/itemId=/);
});

test("navigation between items and read status tracking", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with multiple items
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Nav Test Feed",
  });

  const now = new Date();
  await seedItems(db, feed.id, [
    {
      title: "Item 1 (Newest)",
      publishedAt: new Date(now.getTime() - 1000),
    },
    {
      title: "Item 2 (Middle)",
      publishedAt: new Date(now.getTime() - 2000),
    },
    {
      title: "Item 3 (Oldest)",
      publishedAt: new Date(now.getTime() - 3000),
    },
  ]);

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await expect(page.getByRole("article", { name: /item 1/i })).toBeVisible();

  // 2. Verify all are unread initially
  // Using locator because a11y tree is unreachable when modal is later opened
  const main = page.locator("main");
  const items = main.locator("article").filter({ hasText: /item \d/i });
  const count = await items.count();

  for (let i = 0; i < count; i++) {
    await expect(items.nth(i)).toContainText(/\bunread\b/i);
  }

  // 3. Open the first item. Item 1 should now be read.
  await items.nth(0).click();
  await expect(items.nth(0)).toContainText(/\bread\b/i);

  // 4. Navigate to Next (Item 2) via Button
  const sheet = page.getByRole("dialog", { name: /item reader/i });

  await sheet.getByRole("button", { name: /next item/i }).click();

  // Verify Item 2 is now marked read in dashboard
  await expect(sheet.getByRole("heading", { name: /item 2/i })).toBeVisible();

  await expect(items.nth(1)).toContainText(/\bread\b/i);

  // 5. Navigate to Next (Item 3) via Keyboard 'j'
  await page.keyboard.press("j");

  // Verify Item 3 is now marked read in dashboard
  await expect(sheet.getByRole("heading", { name: /item 3/i })).toBeVisible();

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
  const sheet = page.getByRole("dialog", { name: /item reader/i });

  // 2. Open the dialog and fill in the form
  await sidebar.getByRole("button", { name: /add feed/i }).click();

  await dialog
    .getByRole("textbox", { name: /feed url/i })
    .fill(maliciousFeedUrl);
  await dialog.getByRole("button", { name: /verify/i }).click();
  await dialog.getByRole("button", { name: /add feed/i, exact: true }).click();

  // 3. Verify success and dialog to close
  const toast = page.locator("[data-sonner-toast]");

  await expect(toast).toContainText("Feed added successfully");
  await expect(dialog).not.toBeVisible();

  // 5. Open the malicious item
  await page.getByRole("article", { name: /XSS Item/i }).click();

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
  const [item] = await seedItems(db, feed.id, [{ title: "Direct Item" }]);

  // 1. Go directly to the URL with itemId
  await page.goto(`/dashboard?itemId=${item.id}`);

  // 2.Verify reader is open immediately
  const sheet = page.getByRole("dialog", { name: /item reader/i });

  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("heading", { name: "Direct Item" }),
  ).toBeVisible();
});
