import { expect, test } from "./fixtures/test-extend";

test.describe("Unread Flow", () => {
  test("marking an item as read updates the UI and unread counts", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

    // 1. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 2. Add the feed via TopNav (more stable)
    await page
      .getByRole("banner")
      .getByRole("button", { name: /add feed/i })
      .click();

    const dialog = page.getByRole("dialog", { name: /add feed/i });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/feed url/i).fill(feedUrl);
    await dialog.getByRole("button", { name: /add/i, exact: true }).click();

    // 3. Wait for success toast and feed to be processed
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Feed added successfully",
    );

    // 4. Verify initial unread count in navigation
    // We use a more specific locator to avoid ambiguity
    const allItemsBadge = page
      .locator('[data-slot="sidebar-menu-item"]')
      .filter({ has: page.getByRole("link", { name: /all items/i }) })
      .locator('[data-slot="sidebar-menu-badge"]');
    
    // Initial count for rss-2.xml is 5
    await expect(allItemsBadge).toHaveText("5");

    // 5. Verify unread state on a specific item
    const itemTitle = "Making Complex CSS Shapes Using shape()";
    // Target the article by its constant title text
    const itemCard = page.locator("article", { hasText: itemTitle });
    
    // Check it has the unread indicator text
    await expect(itemCard).toContainText(/\bunread\b/i);

    // 6. Click the item to open reader (which marks as read)
    await page
      .getByRole("button", { name: new RegExp(`Open reader for ${itemTitle}`, "i") })
      .click();

    // 7. Verify unread indicator disappears (text becomes "read")
    // We use a regex with word boundaries to ensure we don't match "unread"
    await expect(itemCard).toContainText(/\bread\b/i);
    await expect(itemCard).not.toContainText(/\bunread\b/i);

    // 8. Verify the item card is now dimmed
    await expect(itemCard).toHaveClass(/opacity-60/);

    // 9. Verify global unread count decremented to 4
    // Use a more robust locator and longer timeout
    const badge = page.locator('[data-slot="sidebar-menu-badge"]').first();
    await expect(badge).toHaveText("4", { timeout: 10000 });

    // 10. Verify Dashboard Toolbar also shows the count
    await expect(page.getByText(/4 unread/i)).toBeVisible();
  });
});
