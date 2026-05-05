import { expect, test } from "./fixtures/test-extend";

test.describe("Mobile Navigation", () => {
  test.beforeEach(async ({ authedPage }) => {
    const { page } = authedPage;
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');
  });

  test("toggles sidebar on mobile", async ({ authedPage }) => {
    const { page } = authedPage;

    const bottomNav = page.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const toggleButton = bottomNav.getByRole("button", {
      name: "Open sidebar menu",
    });

    const sidebar = page.getByRole("dialog");

    // Initially sidebar (Sheet) should be closed on mobile
    await expect(sidebar).not.toBeVisible();

    // `click` fails because of the Next.js float dev overlay
    await toggleButton.press("Enter");

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/frontpage/i);
  });

  test("opens Add Feed Dialog from bottom nav", async ({ authedPage }) => {
    const { page } = authedPage;

    const bottomNav = page.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const addButton = bottomNav.getByRole("button", { name: "Add new feed" });

    await addButton.click();

    // Verify Add Feed dialog appears
    const dialog = page.getByRole("dialog", { name: /add feed/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/feed url/i)).toBeVisible();
  });

  test("renders user menu avatar", async ({ authedPage }) => {
    const { page } = authedPage;

    const bottomNav = page.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const profileButton = bottomNav.getByRole("button", {
      name: "User menu",
    });

    await expect(profileButton).toBeVisible();
    // PU for Playwright User
    await expect(profileButton).toContainText("PU");
  });
});
