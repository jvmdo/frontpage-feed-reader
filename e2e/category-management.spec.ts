import { db } from "@/db";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Category Management", () => {
  test("successfully creates a new category via sidebar", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add category/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /add category/i }),
    ).toBeVisible();

    await dialog.getByLabel(/name/i).fill("New Category");
    await dialog.getByRole("button", { name: /create category/i }).click();

    // Verify toast
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/category created successfully/i);

    // Verify category folder appears in sidebar
    await expect(
      sidebar.getByRole("link", { name: /^new category$/i }),
    ).toBeVisible();

    // Verify it shows "No feeds" initially
    // Expand it first
    await sidebar.getByRole("link", { name: /^new category$/i }).click();
    await expect(sidebar.getByText(/no feeds/i)).toBeVisible();
  });

  test("displays feeds grouped under categories", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a category and a feed linked to it
    const category = await seedCategory(db, {
      userId,
      name: "Tech News",
    });

    await seedFeedWithSubscription(
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

    // Seed another one without category
    await seedFeedWithSubscription(db, userId, {
      title: "Uncategorized Feed",
      url: `https://example.com/rss?tenant=${userId}`,
    });

    // 2. Navigate
    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');

    // 3. Verify category folder is visible
    await expect(
      sidebar.getByRole("link", { name: /^tech news$/i }),
    ).toBeVisible();

    // 4. Verify feed is NOT visible yet (nested)
    await expect(
      sidebar.getByRole("link", { name: /hacker news/i }),
    ).not.toBeVisible();

    // 5. Open category and verify feed is visible
    await sidebar.getByRole("link", { name: /^tech news$/i }).click();
    await expect(
      sidebar.getByRole("link", { name: /hacker news/i }),
    ).toBeVisible();

    // 6. Verify uncategorized feed is visible at root
    await expect(
      sidebar.getByRole("link", { name: /uncategorized feed/i }),
    ).toBeVisible();
  });

  test("handles duplicate category name error", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a category
    await seedCategory(db, {
      userId,
      name: "Duplicate Me",
    });

    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add category/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/name/i).fill("Duplicate Me");
    await dialog.getByRole("button", { name: /create category/i }).click();

    // Verify error toast
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/already exists/i);

    // Dialog should stay open
    await expect(dialog).toBeVisible();
  });

  test("verifies full management flow: empty state, creation, renaming and deleting", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a feed but NO categories
    await seedFeedWithSubscription(db, userId, {
      title: "Uncategorized Feed",
      url: `https://example.com/rss?tenant=${userId}`,
    });

    // 2. Navigate to Dashboard
    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');

    // 3. Navigate to Management Page via Sidebar Action
    await sidebar.getByRole("link", { name: /manage categories/i }).click();
    await expect(page).toHaveURL(/\/manage-categories/);

    // 4. Verify Empty State
    await expect(page.getByText(/no categories yet/i)).toBeVisible();
    const createFirstBtn = page.getByRole("button", {
      name: /create your first category/i,
    });
    await expect(createFirstBtn).toBeVisible();

    // 5. Create Category from Empty State
    await createFirstBtn.click();
    const addDialog = page.getByRole("dialog");
    await addDialog.getByLabel(/name/i).fill("Fresh Category");
    await addDialog.getByRole("button", { name: /create category/i }).click();

    // Verify success toast
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /category created successfully/i,
    );

    // Verify category appears in list
    const main = page.getByRole("main");
    await expect(main.getByText("Fresh Category")).toBeVisible();

    // Verify category folder appears in sidebar
    await expect(
      sidebar.getByRole("link", { name: /^fresh category$/i }),
    ).toBeVisible();

    // 6. Rename Category
    await main.getByRole("button", { name: /rename fresh category/i }).click();

    const renameDialog = page.getByRole("dialog");
    const nameInput = renameDialog.getByRole("textbox", { name: /name/i });
    await nameInput.clear();
    await nameInput.fill("Updated Category");
    await renameDialog.getByRole("button", { name: /save changes/i }).click();

    // Verify success toast
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /renamed successfully/i }),
    ).toBeVisible();

    // Verify name change in list and Sidebar
    await expect(main.getByText("Updated Category")).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: /^updated category$/i }),
    ).toBeVisible();

    // 7. Delete Category
    await main
      .getByRole("button", { name: /delete updated category/i })
      .click();

    const deleteDialog = page.getByRole("alertdialog");
    await deleteDialog
      .getByRole("button", { name: /delete category/i })
      .click();

    // Verify success toast
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /deleted successfully/i }),
    ).toBeVisible();

    // 8. Verify category is gone from Sidebar and we are back to empty state
    await expect(
      sidebar.getByRole("link", { name: /^updated category$/i }),
    ).not.toBeVisible();
    await expect(page.getByText(/no categories yet/i)).toBeVisible();

    // 9. Verify feed is visible at root in sidebar (Uncategorized)
    await expect(
      sidebar.getByRole("link", { name: /uncategorized feed/i }),
    ).toBeVisible();
  });
});
