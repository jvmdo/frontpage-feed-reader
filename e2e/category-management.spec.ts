import { db } from "@/db";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("successfully creates a new category via sidebar", async ({
  authedPage,
}) => {
  const { page } = authedPage;

  // 1. Navigate to the dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  const sidebar = page.locator('[data-slot="sidebar"]');
  const dialog = page.getByRole("dialog", { name: /add category/i });

  // 2. Open Add Category dialog, fill in and submit form
  await sidebar.getByRole("button", { name: /add category/i }).click();
  await dialog.getByLabel(/name/i).fill("New Category");
  await dialog.getByRole("button", { name: /create category/i }).click();

  // 3. Verify creation succeeded
  // Toast should pop up
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /category created successfully/i,
  );

  // Category folder should appear in sidebar
  await expect(
    sidebar.getByRole("link", { name: /new category/i }),
  ).toBeVisible();

  // 4. Verify category is empty initially
  await expect(sidebar.getByText(/no feeds/i)).toBeVisible();
});

test("displays feeds grouped under categories", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed a category and a feed linked to it
  const cat = await seedCategory(db, {
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
      categoryId: cat.id,
    },
  );

  // Seed another one without category
  await seedFeedWithSubscription(db, userId, {
    title: "Uncategorized Feed",
    url: `https://example.com/rss?tenant=${userId}`,
  });

  // 1. Navigate to the dashboard
  await page.goto("/dashboard");

  const sidebar = page.locator('[data-slot="sidebar"]');
  const category = sidebar.getByRole("link", { name: /tech news/i });
  const feed = sidebar.getByRole("link", { name: /hacker news/i });

  // 2. Verify category folder is visible
  await expect(category).toBeVisible();

  // 3. Verify feed is visible yet (default open)
  await expect(feed).toBeVisible();

  // 4. Verify uncategorized feed is visible at root
  await expect(
    sidebar.getByRole("link", { name: /uncategorized feed/i }),
  ).toBeVisible();
});

test("handles duplicate category name error", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed a category
  await seedCategory(db, {
    userId,
    name: "Duplicate Me",
  });

  // 1. Navigate to the dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  const dialog = page.getByRole("dialog", { name: /add category/i });

  // 2. Open dialog, fill in and submit form for duplicated category
  await page.getByRole("button", { name: /add category/i }).click();
  await dialog.getByLabel(/name/i).fill("Duplicate Me");
  await dialog.getByRole("button", { name: /create category/i }).click();

  // 3. Verify error toast
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /already exists/i,
  );

  // Dialog should stay open
  await expect(dialog).toBeVisible();
});

test("verifies full management flow: empty state, creation, editing and deleting", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed but NO categories
  await seedFeedWithSubscription(db, userId, {
    title: "Uncategorized Feed",
    url: `https://example.com/rss?tenant=${userId}`,
  });

  // 1. Navigate and wait for hydration
  await page.goto("/manage-categories");
  await page.waitForSelector('body[data-hydrated="true"]');

  const sidebar = page.locator('[data-slot="sidebar"]');
  const main = page.getByRole("main");
  const addDialog = page.getByRole("dialog", { name: /add category/i });
  const deleteDialog = page.getByRole("alertdialog");

  // 2. Verify Empty State
  await expect(main.getByText(/no categories yet/i)).toBeVisible();

  // 3. Create a new category with a specific color
  await main.getByRole("button", { name: /create .* category/i }).click();
  await addDialog.getByLabel(/name/i).fill("Fresh Category");

  // Select a color
  const redColorHex = "#dc2626";
  const redColorRgb = "rgb(220, 38, 38)";
  await addDialog.getByRole("button", { name: /select color/i }).click();
  await page.getByRole("button", { name: redColorHex, exact: true }).click();

  await addDialog.getByRole("button", { name: /create category/i }).click();

  // 4. Verify operation succeeded
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /category created successfully/i,
  );
  await expect(main.getByText("Fresh Category")).toBeVisible();

  // Verify color indicator is present in the list
  const colorIndicator = main
    .locator("li")
    .filter({ hasText: "Fresh Category" })
    .getByTestId("category-color-indicator");
  await expect(colorIndicator).toHaveCSS("background-color", redColorRgb);

  await expect(
    sidebar.getByRole("link", { name: /fresh category/i }),
  ).toBeVisible();

  // Verify color dot in sidebar
  const sidebarDot = sidebar
    .getByRole("link", { name: /fresh category/i })
    .getByTestId("sidebar-category-dot");
  await expect(sidebarDot).toHaveCSS("background-color", redColorRgb);

  // 5. Edit Category
  await main.getByRole("button", { name: /edit fresh category/i }).click();

  const editDialog = page.getByRole("dialog", { name: /edit category/i });
  const nameInput = editDialog.getByRole("textbox", { name: /name/i });
  await nameInput.clear();
  await nameInput.fill("Updated Category");

  // Change color to green
  const greenColorHex = "#16a34a";
  const greenColorRgb = "rgb(22, 163, 74)";
  await editDialog.getByRole("button", { name: /select color/i }).click();
  await page.getByRole("button", { name: greenColorHex, exact: true }).click();

  await editDialog.getByRole("button", { name: /save changes/i }).click();

  // 6. Verify operation succeeded
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /updated successfully/i }),
  ).toBeVisible();

  await expect(main.getByText(/updated category/i)).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: /updated category/i }),
  ).toBeVisible();

  // Verify green color in sidebar
  const updatedSidebarDot = sidebar
    .getByRole("link", { name: /updated category/i })
    .getByTestId("sidebar-category-dot");
  await expect(updatedSidebarDot).toHaveCSS("background-color", greenColorRgb);

  // 7. Delete Category
  await main.getByRole("button", { name: /delete updated category/i }).click();
  await deleteDialog.getByRole("button", { name: /delete category/i }).click();

  // 8. Verify operation succeeded
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /deleted successfully/i }),
  ).toBeVisible();

  await expect(
    sidebar.getByRole("link", { name: /updated category/i }),
  ).not.toBeVisible();
  await expect(main.getByText(/no categories yet/i)).toBeVisible();

  // 9. Verify feed is visible at root in sidebar (Uncategorized)
  await expect(
    sidebar.getByRole("link", { name: /uncategorized feed/i }),
  ).toBeVisible();
});
