import { db } from "@/db";
import {
  seedCategory,
  seedItems,
  seedFeedWithSubscription,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("marking a category as read updates all items and counts", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a category and a feed with unread items
  const cat = await seedCategory(db, {
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
      categoryId: cat.id,
    },
  );

  await seedItems(db, feed.id, [
    { title: "Item 1", guid: "item-1" },
    { title: "Item 2", guid: "item-2" },
    { title: "Item 3", guid: "item-3" },
  ]);

  // 1. Navigate to the category view
  await page.goto(`/dashboard?categoryId=${cat.id}`);

  const category = page.getByRole("link", { name: /Tech News/i });
  const items = page.getByRole("article", { name: /item \d/i });

  // 2. Verify initial state in Toolbar (it also guarantees hydration is complete)
  await expect(page.getByRole("heading", { name: "Tech News" })).toBeVisible();
  await expect(page.getByText(/3 unread/i)).toBeVisible();

  // 3. Verify initial state in Sidebar
  await expect(category.getByLabel(/unread items/i)).toHaveText("3");
  await expect(items.filter({ hasText: /\bunread\b/i })).toHaveCount(3);

  // 4. Trigger "Mark all as read"
  await page.getByRole("button", { name: /mark all read/i }).click();

  // 5. Confirm the dialog
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /mark all as read/i })
    .click();

  // 6. Verify everything is marked as read
  // Indicators should be gone
  await expect(items.filter({ hasText: /\bread\b/i })).toHaveCount(3);

  // Counts should be gone
  await expect(category.getByLabel(/unread items/i)).not.toBeVisible();

  // Global count in "All Items" should also be updated
  const allItemsItem = page
    .getByRole("listitem")
    .filter({ hasText: "All Items" });

  await expect(
    allItemsItem.locator('[data-slot="sidebar-menu-badge"]'),
  ).not.toBeVisible();
});
