import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Organizational Flow", () => {
  test("full flow: category creation, assignment via edit dialog, breadcrumb nesting, and empty state assignment", async ({
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

    // 2. Step 1: Create a category "Tech" via sidebar
    await page.goto("/dashboard");
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add category/i }).click();

    const addDialog = page.getByRole("dialog", { name: /add category/i });
    await addDialog.getByLabel(/name/i).fill("Tech");
    await addDialog.getByRole("button", { name: /create category/i }).click();

    // Verify toast and sidebar
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /category created successfully/i }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Tech", exact: true }),
    ).toBeVisible();

    // 3. Step 2: Navigate to "Manage Feeds" and assign "Feed A" to "Tech"
    await page.getByRole("link", { name: "Manage Feeds" }).click();
    await expect(
      page.getByRole("heading", { name: "Manage Feeds" }),
    ).toBeVisible();

    // Open Edit dialog for Feed A
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const editDialog = page.getByRole("dialog", { name: "Edit Subscription" });
    // Select category "Tech"
    await editDialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "Tech", exact: true }).click();
    await editDialog.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /subscription updated/i }),
    ).toBeVisible();

    // 4. Step 3: Click "Tech" in sidebar and verify filtering
    await sidebar.getByRole("link", { name: "Tech", exact: true }).click();

    // Expand the category folder
    const techGroup = sidebar.getByRole("listitem").filter({ hasText: "Tech" });
    await techGroup.getByRole("button", { name: "Toggle" }).click();

    // Verify Feed A is visible under Tech
    await expect(techGroup.getByRole("link", { name: "Feed A" })).toBeVisible();

    // Verify URL
    await expect(page).toHaveURL(/categoryId=/);

    // Verify Breadcrumb: Frontpage > Tech
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(breadcrumb.getByText("Frontpage")).toBeVisible();
    await expect(breadcrumb.getByText("Tech", { exact: true })).toBeVisible();
    await expect(breadcrumb.getByText("All Items")).not.toBeVisible();

    // Verify highlighting
    await expect(
      sidebar.getByRole("link", { name: "All Items" }),
    ).not.toHaveAttribute("data-active", "true");
    await expect(
      sidebar.getByRole("link", { name: "Tech", exact: true }),
    ).toHaveAttribute("data-active", "true");

    // Verify items
    await expect(
      page.getByRole("heading", { name: "Item from Feed A" }),
    ).toBeVisible();

    // 5. Step 4: Click "Feed A" under "Tech" and verify nesting
    await techGroup.getByRole("link", { name: "Feed A" }).click();

    await expect(page).toHaveURL(/feedId=/);
    await expect(breadcrumb.getByText("Frontpage")).toBeVisible();
    await expect(breadcrumb.getByText("Tech", { exact: true })).toBeVisible();
    await expect(breadcrumb.getByText("Feed A")).toBeVisible();

    // Verify Tech is still expanded and Feed A active
    await expect(
      techGroup.getByRole("link", { name: "Feed A" }),
    ).toHaveAttribute("data-active", "true");

    // 6. Step 5: Create another category "Empty" and test empty state assignment
    await sidebar.getByRole("button", { name: /add category/i }).click();
    await addDialog.getByLabel(/name/i).fill("Empty");
    await addDialog.getByRole("button", { name: /create category/i }).click();

    // Click "Empty" category
    await sidebar.getByRole("link", { name: "Empty", exact: true }).click();

    // Verify specific empty state
    await expect(page.getByText("Empty has no items yet")).toBeVisible();
    await page.getByRole("button", { name: "Assign feeds" }).click();

    // 7. Step 6: Assign Feed A to "Empty" via empty state button
    const assignDialog = page.getByRole("dialog", {
      name: /assign feeds to empty/i,
    });

    // Move Feed A to Empty
    await assignDialog
      .getByRole("button", { name: /move feed a to empty/i })
      .click();
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /feed moved to category/i }),
    ).toBeVisible();

    // Close dialog
    await page.keyboard.press("Escape");

    // Verify Feed A items appear
    await expect(
      page.getByRole("heading", { name: "Item from Feed A" }),
    ).toBeVisible();

    // Verify sidebar: Feed A moved
    const emptyGroup = sidebar
      .getByRole("listitem")
      .filter({ hasText: "Empty" });
    await emptyGroup.getByRole("button", { name: "Toggle" }).click();
    await expect(
      emptyGroup.getByRole("link", { name: "Feed A" }),
    ).toBeVisible();

    // Verify Feed A no longer under Tech
    const techGroupAfter = sidebar
      .getByRole("listitem")
      .filter({ hasText: "Tech" });
    await expect(
      techGroupAfter.getByRole("link", { name: "Feed A" }),
    ).not.toBeVisible();
  });
});
