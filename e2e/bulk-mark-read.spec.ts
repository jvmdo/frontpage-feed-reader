import { db } from "@/db";
import {
  seedCategory,
  seedFeedItems,
  seedFeedWithSubscription,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Bulk Mark Read", () => {
  test("marking a category as read updates all items and counts", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a category and a feed with unread items
    const category = await seedCategory(db, {
      userId,
      name: "Tech News",
    });

    const { feed } = await seedFeedWithSubscription(
      db,
      userId,
      {
        title: "Hacker News",
        url: `https://news.ycombinator.com/rss?tenant=${userId}`,
      },
      {
        categoryId: category.id,
      },
    );

    await seedFeedItems(db, feed.id, [
      { title: "Item 1", guid: "item-1" },
      { title: "Item 2", guid: "item-2" },
      { title: "Item 3", guid: "item-3" },
    ]);

    // 2. Navigate to the category view
    await page.goto(`/dashboard?categoryId=${category.id}`);

    // 3. Verify initial state in Header (easier to find)
    const header = page.locator("header");
    await expect(header.locator("h1")).toHaveText(/Tech News 3 unread/i);

    // Verify initial state in Sidebar
    const sidebar = page.locator('[data-slot="sidebar"]');
    const categoryBadge = sidebar
      .locator('li:has-text("Tech News")')
      .locator('[data-slot="sidebar-menu-badge"]')
      .first();
    
    await expect(categoryBadge).toHaveText("3");

    const items = page.locator("article");
    await expect(items).toHaveCount(3);
    // All should have unread indicators
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i).locator(".bg-unread-indicator")).toBeVisible();
    }

    // 4. Trigger "Mark all as read"
    const markAllReadBtn = page.getByRole("button", { name: /mark all as read/i });
    await markAllReadBtn.click();

    // 5. Confirm the dialog
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^mark all as read$/i }).click();

    // 6. Verify everything is marked as read
    // Indicators should be gone
    await expect(page.locator(".bg-unread-indicator")).toHaveCount(0);

    // Items should be dimmed (opacity-70)
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i)).toHaveClass(/opacity-70/);
    }

    // Counts should be gone (0 unread items -> badge/count text not rendered)
    await expect(categoryBadge).not.toBeVisible();
    await expect(header.locator("h1")).toHaveText(/^Tech News$/);

    // Global count in "All Items" should also be updated
    const allItemsBadge = sidebar
      .locator('li:has-text("All Items")')
      .locator('[data-slot="sidebar-menu-badge"]');
    await expect(allItemsBadge).not.toBeVisible();
  });
});
