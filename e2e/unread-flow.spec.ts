import { expect, test } from "./fixtures/test-extend";

test.describe("Unread Flow", () => {
  test("marking an item as read updates the UI and unread counts", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

    // 1. Navigate to dashboard
    await page.goto("/dashboard");

    // 2. Add the feed
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add feed/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/feed url/i).fill(feedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // 3. Wait for success toast and feed to be processed
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Feed added successfully",
    );

    // 4. Verify initial unread count in sidebar
    const allItemsBadge = sidebar
      .locator('li:has-text("All Items")')
      .locator('[data-slot="sidebar-menu-badge"]');
    await expect(allItemsBadge).toHaveText("5");

    // 5. Verify unread indicator on a specific item
    const itemTitle = "Making Complex CSS Shapes Using shape()";
    const itemCard = page.locator("article", { hasText: itemTitle });

    // Check for the blue dot (bg-unread-indicator class)
    const unreadDot = itemCard.locator(".bg-unread-indicator");
    await expect(unreadDot).toBeVisible();

    // Check for the blue left border
    await expect(itemCard).toHaveClass(/border-l-unread-indicator/);

    // 6. Click the item link to mark as read
    // We target the button specifically
    const itemLink = itemCard.getByRole("button", { name: new RegExp(itemTitle, "i") });

    // Before clicking, let's ensure we are tracking the network request if possible,
    // but Playwright's expect.poll or just awaiting the state change is usually better.
    await itemLink.click();

    // 7. Verify unread indicator disappears
    await expect(unreadDot).not.toBeVisible();
    await expect(itemCard).not.toHaveClass(/border-l-unread-indicator/);

    // 8. Verify the item card is now dimmed (opacity-70)
    await expect(itemCard).toHaveClass(/opacity-70/);

    // 9. Verify global unread count decremented to 4
    await expect(allItemsBadge).toHaveText("4");

    // 10. Verify Dashboard Header also shows the count
    const header = page.locator("main header");
    await expect(header.locator("h1")).toHaveText(/All Items 4 unread/i);
  });
});
