import { expect, test } from "./fixtures/test-extend";

test("marking an item as read updates the UI and unread counts", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;
  const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Add the feed via TopNav
  await page
    .getByRole("banner")
    .getByRole("button", { name: /add feed/i })
    .click();

  const dialog = page.getByRole("dialog", { name: /add feed/i });

  await dialog.getByLabel(/feed url/i).fill(feedUrl);
  await dialog.getByRole("button", { name: /verify/i }).click();
  await dialog.getByRole("button", { name: /add/i, exact: true }).click();

  // 3. Wait for success toast and feed to be processed
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /feed added successfully/i }),
  ).toBeVisible();

  // 4. Verify initial unread count in navigation
  const allItemsBadge = page
    .locator('[data-slot="sidebar-menu-item"]')
    .filter({ has: page.getByRole("link", { name: /all items/i }) })
    .locator('[data-slot="sidebar-menu-badge"]');

  // Initial count for rss-2.xml is 5
  await expect(allItemsBadge).toHaveText("5");

  // 5. Verify unread state on a specific item
  // Using locator because a11y tree is unreachable when modal is open
  const itemCard = page.locator("article", { hasText: /making complex css/i });

  // Check it has the unread indicator text
  await expect(itemCard).toContainText(/\bunread\b/i);

  // Click the item to open reader (which marks as read)
  await itemCard.click();

  // Unread indicator disappears (text becomes "read")
  await expect(itemCard).toContainText(/\bread\b/i);
  await expect(itemCard).not.toContainText(/\bunread\b/i);

  // 6. Verify global unread count decremented to 4
  const badge = page.locator('[data-slot="sidebar-menu-badge"]').first();

  await expect(badge).toHaveText("4");

  // 7. Verify Dashboard Toolbar also shows the count
  await expect(page.getByText(/4 unread/i)).toBeVisible();
});
