import { db } from "@/db";
import { seedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("category creation, assignment via edit dialog, and empty state assignment", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: User with 1 feed ("Feed A") that has items
  const { feed: feedA } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed-a.com/rss?tenant=${userId}`,
    title: "Feed A",
  });

  await seedItems(db, feedA.id, [
    {
      guid: `item-a-${userId}`,
      title: "Item from Feed A",
    },
  ]);

  // 1. Navigate to the dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Open Add Category dialog and submit form
  await page.getByRole("button", { name: /add category/i }).click();

  const addDialog = page.getByRole("dialog", { name: /add category/i });

  await addDialog.getByLabel(/name/i).fill("Tech");
  await addDialog.getByRole("button", { name: /create category/i }).click();

  // 3. Verify operation succeeded
  await expect(page.locator("[data-sonner-toast]")).toBeVisible();

  const category = page.getByRole("link", { name: /tech/i });

  await expect(category).toBeVisible();

  // 4. Navigate to "Manage Feeds" page and wait for hydration
  await page.getByRole("link", { name: /click to manage feeds/i }).click();
  await expect(
    page.getByRole("status", { name: /loading categories/i }),
  ).toBeHidden();

  // 5. Open Edit dialog and assign "Feed A" to "Tech"
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  const editDialog = page.getByRole("dialog", { name: /edit subscription/i });

  await editDialog.getByRole("combobox").click();
  await page.getByRole("option", { name: /tech/i }).click(); // Portal
  await editDialog.getByRole("button", { name: "Save Changes" }).click();

  // 6. Verify operation succeeded
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /subscription updated/i }),
  ).toBeVisible();

  // 7. Click "Tech" category and verify Feed A is visible under Tech in navigation
  await category.click();

  const feedALink = page.getByRole("link", { name: "Feed A" });

  await expect(feedALink).toBeVisible();

  // 8. Verify URL updated
  await expect(page).toHaveURL(/categoryId=/);

  // 9. Verify items in main view
  await expect(
    page.getByRole("heading", { name: "Item from Feed A" }),
  ).toBeVisible();

  // 10. Click "Feed A" under "Tech" and verify nesting
  await feedALink.click();

  await expect(page).toHaveURL(/feedId=/);

  // 11. Create another category "Empty" and test empty state assignment
  await page.getByRole("button", { name: /add category/i }).click();

  const addDialog2 = page.getByRole("dialog", { name: /add category/i });

  await addDialog2.getByLabel(/name/i).fill("Empty");
  await addDialog2.getByRole("button", { name: /create category/i }).click();

  // 12. Click "Empty" category
  const emptyCategoryLink = page.getByRole("link", { name: /^Empty$/i });

  await emptyCategoryLink.click();

  // 13. Verify specific empty state in main view
  await expect(page.getByText("Empty has no items yet")).toBeVisible();

  await page.getByRole("button", { name: "Assign feeds" }).click();

  // 14. Assign Feed A to "Empty" via empty state button
  const assignDialog = page.getByRole("dialog", { name: /manage feeds/i });

  await expect(assignDialog).toBeVisible();

  // 14. Move Feed A to Empty
  await assignDialog
    .getByRole("button", { name: /move feed a to category/i })
    .click();

  await page.keyboard.press("Escape");

  // 15. Verify operation succeeded
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /feed moved to category/i }),
  ).toBeVisible();

  // Feed A items appear in main view
  await expect(
    page.getByRole("heading", { name: "Item from Feed A" }),
  ).toBeVisible();

  // Verify navigation: Feed A moved
  await expect(emptyCategoryLink).toBeVisible();

  // Ensure Feed A is visible (should be expanded after move/navigation)
  await expect(page.getByRole("link", { name: "Feed A" })).toBeVisible();

  // Verify Feed A no longer under Tech (Tech should be collapsed or Feed A removed from its list)
  const techItem = page.getByRole("listitem").filter({ hasText: /^Tech$/ });
  await expect(
    techItem.getByRole("link", { name: "Feed A" }),
  ).not.toBeVisible();
});
