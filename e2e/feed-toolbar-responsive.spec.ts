import { db } from "@/db";
import { seedCategory } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("FeedToolbar Responsiveness and View Options", () => {
  test("switches between desktop buttons and mobile menu based on viewport", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: Category to show 'Assign' button
    const cat = await seedCategory(db, { userId, name: "Tech" });
    await page.goto(`/dashboard?categoryId=${cat.id}`);
    await page.waitForSelector('body[data-hydrated="true"]');

    // 1. Desktop View (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });

    // Desktop-only buttons should be visible in toolbar
    await expect(page.getByRole("radio", { name: "List view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Newest" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Assign", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Refresh", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark all read" }),
    ).toBeVisible();

    // Menu button in toolbar should be hidden
    await expect(
      page.locator("header").getByRole("button", { name: "Feed menu" }),
    ).not.toBeVisible();

    // 2. Tablet View (800px)
    await page.setViewportSize({ width: 800, height: 800 });

    // Desktop-only layout/sorting/refresh buttons should be hidden
    await expect(
      page.getByRole("radio", { name: "List view" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Newest" }),
    ).not.toBeVisible();

    // "Menu" button should now be visible in toolbar (md-lg)
    const toolbar = page.getByRole("toolbar", { name: "Feed toolbar" });
    const toolbarMenu = toolbar.getByRole("button", { name: "Feed menu" });
    await expect(toolbarMenu).toBeVisible();

    // 3. Mobile View (375px)
    await page.setViewportSize({ width: 375, height: 667 });

    // Toolbar menu should be hidden (md-only)
    await expect(toolbarMenu).not.toBeVisible();

    // Mobile Bottom Nav should be visible and contain the menu
    const bottomNav = page.getByRole("toolbar", {
      name: /mobile quick actions/i,
    });
    const bottomNavMenu = bottomNav.getByRole("button", { name: "Feed menu" });

    await expect(bottomNavMenu).toBeVisible();

    // Open the menu and verify items
    await bottomNavMenu.click();

    const menu = page.getByRole("menu");

    await expect(
      menu.getByRole("menuitem", { name: /refresh/i }),
    ).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /assign/i })).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: /mark all read/i }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitemradio", { name: /list/i }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitemradio", { name: /newest/i }),
    ).toBeVisible();
  });

  test("layout toggles update URL state", async ({ authedPage }) => {
    const { page } = authedPage;

    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');
    await page.setViewportSize({ width: 1280, height: 800 });

    // Test Layout Toggles
    await page.getByRole("radio", { name: "Grid view" }).click();
    await expect(page).toHaveURL(/layout=grid/);

    await page.getByRole("radio", { name: "Rows view" }).click();
    await expect(page).toHaveURL(/layout=rows/);

    await page.getByRole("radio", { name: "List view" }).click();
    await expect(page).not.toHaveURL(/layout=(grid|rows)/);
  });
});
