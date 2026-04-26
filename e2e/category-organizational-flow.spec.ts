import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("category creation, assignment via edit dialog, and empty state assignment", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // 1. Setup: User with 1 feed ("Feed A") that has items
  const { feed: feedA } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed-a.com/rss?tenant=${userId}`,
    title: "Feed A",
  });

  await seedFeedItems(db, feedA.id, [
    {
      guid: `item-a-${userId}`,
      title: "Item from Feed A",
    },
  ]);

  // 2. Create a category "Tech" via sidebar
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Open Add Category dialog
  await page.getByRole("button", { name: /add category/i }).click();

  // Submit form
  const addDialog = page.getByRole("dialog", { name: /add category/i });

  await addDialog.getByLabel(/name/i).fill("Tech");
  await addDialog.getByRole("button", { name: /create category/i }).click();

  // Verify toast
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /category created successfully/i }),
  ).toBeVisible();

  // Verify category folder appears in navigation
  const techCategoryLink = page.getByRole("link", { name: /tech/i });

  await expect(techCategoryLink).toBeVisible();

  // 3. Navigate to "Manage Feeds" and assign "Feed A" to "Tech"
  await page.getByRole("link", { name: /click to manage feeds/i }).click();

  // await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Manage Feeds" }),
  ).toBeVisible();

  // Open Edit dialog for Feed A
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  const editDialog = page.getByRole("dialog", { name: /edit subscription/i });

  await editDialog.getByRole("combobox").click();
  await page.getByRole("option", { name: /tech/i }).click(); // Portal
  await editDialog.getByRole("button", { name: "Save Changes" }).click();

  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /subscription updated/i }),
  ).toBeVisible();

  // 4. Click "Tech" in navigation and verify filtering
  await techCategoryLink.click();
  await page.waitForLoadState("networkidle");

  // Verify Feed A is visible under Tech in navigation
  const feedALink = page.getByRole("link", { name: "Feed A" });
  await expect(feedALink).toBeVisible();

  // Verify URL and active state
  await expect(page).toHaveURL(/categoryId=/);
  await expect(techCategoryLink).toHaveAttribute("data-active", "true");

  // Verify items in main view
  await expect(
    page.getByRole("heading", { name: "Item from Feed A" }),
  ).toBeVisible();

  // 5. Click "Feed A" under "Tech" and verify nesting
  await feedALink.click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(/feedId=/);
  await expect(feedALink).toHaveAttribute("data-active", "true");

  // 6. Create another category "Empty" and test empty state assignment
  await page.getByRole("button", { name: /add category/i }).click();

  const addDialog2 = page.getByRole("dialog", { name: /add category/i });

  await addDialog2.getByLabel(/name/i).fill("Empty");
  await addDialog2.getByRole("button", { name: /create category/i }).click();

  // Click "Empty" category
  const emptyCategoryLink = page.getByRole("link", { name: /^Empty$/i });

  await emptyCategoryLink.click();
  await page.waitForLoadState("networkidle");

  // Verify specific empty state in main view
  await expect(page.getByText("Empty has no items yet")).toBeVisible();
  await page.getByRole("button", { name: "Assign feeds" }).click();

  // 7. Assign Feed A to "Empty" via empty state button
  const assignDialog = page.getByRole("dialog", { name: /manage feeds/i });
  await expect(assignDialog).toBeVisible();

  // Move Feed A to Empty
  await assignDialog
    .getByRole("button", { name: /move feed a to category/i })
    .click();

  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /feed moved to category/i }),
  ).toBeVisible();

  // Close dialog
  await page.keyboard.press("Escape");

  // Verify Feed A items appear in main view
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
