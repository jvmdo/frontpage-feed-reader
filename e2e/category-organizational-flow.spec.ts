import { db } from "@/db";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("moves a feed to a category via empty state button", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: One empty category and one unassigned feed with items
  const cat = await seedCategory(db, { userId, name: "Empty Category" });
  const { feed } = await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/rss?tenant=${userId}`,
    title: "Unassigned Feed",
  });

  await seedItems(db, feed.id, [
    {
      guid: `item-${userId}`,
      title: "Featured Article",
    },
  ]);

  // 1. Navigate to dashboard and click the empty category
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  await page.getByRole("link", { name: "Empty Category" }).click();

  // 2. Verify URL and empty state
  await expect(page).toHaveURL(new RegExp(`categoryId=${cat.id}`));
  await expect(
    page.getByText(/Empty Category has no items yet/i),
  ).toBeVisible();

  // 3. Move feed to this category in the dialog
  await page.getByRole("button", { name: /assign feeds/i }).click();
  const dialog = page.getByRole("dialog", { name: /manage feeds/i });
  await dialog
    .getByRole("button", { name: /move unassigned feed to category/i })
    .click();

  // 4. Verify toast and close dialog
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /feed moved to category/i,
  );
  await page.keyboard.press("Escape");

  // 5. Verify feed is now listed under category in sidebar and items are visible
  const sidebar = page.locator('[data-slot="sidebar"]');
  const catItem = sidebar
    .getByRole("listitem")
    .filter({ hasText: "Empty Category" });

  await page.getByRole("link", { name: "Empty Category" }).click();
  await expect(
    catItem.getByRole("link", { name: "Unassigned Feed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Featured Article" }),
  ).toBeVisible();
});

test("moves a feed between categories via toolbar", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Feed 1 in Category A, Category B is empty
  const catA = await seedCategory(db, { userId, name: "Category A" });
  const catB = await seedCategory(db, { userId, name: "Category B" });

  const { feed } = await seedFeedWithSubscription(
    db,
    userId,
    {
      url: `https://example.com/rss-2?tenant=${userId}`,
      title: "Moving Feed",
    },
    { categoryId: catA.id },
  );

  await seedItems(db, feed.id, [
    { guid: `item-2-${userId}`, title: "Moving Item" },
  ]);

  // 1. Navigate to Category B (target)
  await page.goto(`/dashboard?categoryId=${catB.id}`);
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Open "Assign" dialog from toolbar
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /manage feeds/i });

  // 3. Move from A to B
  await dialog
    .getByRole("button", { name: /move moving feed to category/i })
    .click();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /feed moved to category/i }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // 4. Verify items appeared in the current view (Category B)
  await expect(
    page.getByRole("heading", { name: "Moving Item" }),
  ).toBeVisible();

  // 5. Verify movement in sidebar
  const sidebar = page.locator('[data-slot="sidebar"]');

  const itemA = sidebar.getByRole("listitem").filter({ hasText: "Category A" });
  const itemB = sidebar.getByRole("listitem").filter({ hasText: "Category B" });

  await expect(
    itemA.getByRole("link", { name: "Moving Feed" }),
  ).not.toBeVisible();
  await expect(itemB.getByRole("link", { name: "Moving Feed" })).toBeVisible();
});

test("removes a feed from a category via toolbar", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Feed already in a category
  const cat = await seedCategory(db, { userId, name: "ToRemove" });

  const { feed } = await seedFeedWithSubscription(
    db,
    userId,
    {
      url: `https://example.com/rss-remove?tenant=${userId}`,
      title: "Removable Feed",
    },
    { categoryId: cat.id },
  );

  await seedItems(db, feed.id, [
    { guid: `item-rem-${userId}`, title: "To Be Removed" },
  ]);

  // 1. Navigate to category page
  await page.goto(`/dashboard?categoryId=${cat.id}`);
  await page.waitForSelector('body[data-hydrated="true"]');

  // Verify initial state
  await expect(page).toHaveURL(new RegExp(`categoryId=${cat.id}`));
  await expect(
    page.getByRole("heading", { name: "To Be Removed" }),
  ).toBeVisible();

  // 2. Open "Assign" dialog from toolbar
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /manage feeds/i });

  // 3. Remove feed from category
  await dialog
    .getByRole("button", { name: /remove removable feed from category/i })
    .click();

  // 4. Verify toast
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /feed removed from category/i }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  // 5. Verify URL remains but content updates to empty state
  await expect(page).toHaveURL(new RegExp(`categoryId=${cat.id}`));
  await expect(page.getByText(/ToRemove has no items yet/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "To Be Removed" }),
  ).not.toBeVisible();

  // 6. Verify sidebar reflects removal
  const sidebar = page.locator('[data-slot="sidebar"]');
  const catItem = sidebar.getByRole("listitem").filter({ hasText: "ToRemove" });

  await expect(
    catItem.getByRole("link", { name: "Removable Feed" }),
  ).not.toBeVisible();
});
