import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Keyboard Shortcuts", () => {
  test.beforeEach(async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // Setup: Seed a feed with multiple items
    const { feed } = await seedFeedWithSubscription(db, userId, {
      title: "Keyboard Shortcuts Feed",
    });

    const now = new Date();
    await seedItems(db, feed.id, [
      { title: "Item 1", publishedAt: new Date(now.getTime() - 1000) },
      { title: "Item 2", publishedAt: new Date(now.getTime() - 2000) },
      { title: "Item 3", publishedAt: new Date(now.getTime() - 3000) },
    ]);

    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');
  });

  test("feed list navigation and actions", async ({ authedPage }) => {
    const { page } = authedPage;
    const items = page.locator("article").filter({ hasText: /Item \d/i });
    await expect(items).toHaveCount(3);

    // j: focus first item
    await page.keyboard.press("j");
    await expect(items.nth(0)).toHaveAttribute("data-focused", "true");

    // j: focus second item
    await page.keyboard.press("j");
    await expect(items.nth(0)).not.toHaveAttribute("data-focused", "true");
    await expect(items.nth(1)).toHaveAttribute("data-focused", "true");

    // k: focus first item again
    await page.keyboard.press("k");
    await expect(items.nth(0)).toHaveAttribute("data-focused", "true");

    // m: toggle read status
    await expect(items.nth(0)).toContainText(/\bunread\b/i);
    await page.keyboard.press("m");
    await expect(items.nth(0)).toContainText(/\bread\b/i);
    await page.keyboard.press("m");
    await expect(items.nth(0)).toContainText(/\bunread\b/i);

    // s: toggle bookmark
    const bookmarkBtn = items
      .nth(0)
      .getByRole("button", { name: /save for later/i });
    await expect(bookmarkBtn).toBeVisible();
    await page.keyboard.press("s");
    // Assert that the label changes (or state changes)
    await expect(
      items.nth(0).getByRole("button", { name: /remove from saved/i }),
    ).toBeVisible();

    // Escape: clear focus
    await page.keyboard.press("Escape");
    await expect(items.nth(0)).not.toHaveAttribute("data-focused", "true");
  });

  test("reader view scope overrides", async ({ authedPage }) => {
    const { page } = authedPage;
    const items = page.locator("article").filter({ hasText: /Item \d/i });

    // Focus first item and open reader with 'o'
    await page.keyboard.press("j");
    await page.keyboard.press("o");

    const readerDialog = page.getByRole("dialog", { name: /item reader/i });
    await expect(readerDialog).toBeVisible();
    await expect(
      readerDialog.getByRole("heading", { name: "Item 1" }),
    ).toBeVisible();

    // j: Navigate to next item inside reader
    await page.keyboard.press("j");
    await expect(
      readerDialog.getByRole("heading", { name: "Item 2" }),
    ).toBeVisible();

    // k: Navigate back inside reader
    await page.keyboard.press("k");
    await expect(
      readerDialog.getByRole("heading", { name: "Item 1" }),
    ).toBeVisible();

    // m: Toggle read status inside reader
    // (Item is auto-marked as read by default on open, but pressing 'm' will mark it unread)
    await page.keyboard.press("m");

    // s: Toggle bookmark inside reader
    await page.keyboard.press("s");

    // Close reader with Escape
    await page.keyboard.press("Escape");
    await expect(readerDialog).not.toBeVisible();

    // Verify 's' successfully bookmarked the item in the list behind it
    await expect(
      items.nth(0).getByRole("button", { name: /remove from saved/i }),
    ).toBeVisible();
  });

  test("global shortcuts and modal bleed protection", async ({
    authedPage,
  }) => {
    const { page } = authedPage;
    const items = page.locator("article").filter({ hasText: /Item \d/i });

    await page.keyboard.press("Meta+k");
    const searchDialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(searchDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchDialog).not.toBeVisible();

    // Focus an item
    await page.keyboard.press("j");
    await expect(items.nth(0)).toHaveAttribute("data-focused", "true");

    // Global shortcut: Shortcuts map via Shift+/ (?)
    await page.keyboard.press("Shift+/");
    const shortcutsDialog = page.getByRole("dialog", {
      name: /keyboard shortcuts/i,
    });
    await expect(shortcutsDialog).toBeVisible();

    // Ensure list navigation is blocked while modal is open
    await page.keyboard.press("j");
    await expect(items.nth(0)).toHaveAttribute("data-focused", "true"); // Focus should not move to Item 2

    // Escape safely closes the modal without bleeding to the list (clearing focus)
    await page.keyboard.press("Escape");
    await expect(shortcutsDialog).not.toBeVisible();

    // List focus must remain perfectly intact
    await expect(items.nth(0)).toHaveAttribute("data-focused", "true");
  });
});
