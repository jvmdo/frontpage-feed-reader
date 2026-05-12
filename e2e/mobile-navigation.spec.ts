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

    const bottomNav = page.getByRole("toolbar", {
      name: /mobile quick actions/i,
    });
    const toggleButton = bottomNav.getByRole("button", {
      name: /open sidebar/i,
    });
    const sidebar = page.getByRole("dialog");

    // Initially sidebar (Sheet) should be closed on mobile
    await expect(sidebar).not.toBeVisible();

    // `click` fails because of the Next.js float dev overlay
    await toggleButton.press("Enter");

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/frontpage/i);
  });

  test("opens Add Feed dialog", async ({ authedPage }) => {
    const { page } = authedPage;

    const bottomNav = page.getByRole("toolbar", {
      name: /mobile quick actions/i,
    });
    const addButton = bottomNav.getByRole("button", { name: /add new feed/i });

    await addButton.click();

    // Verify Add Feed dialog appears
    await expect(page.getByRole("dialog", { name: /add feed/i })).toBeVisible();
  });

  test("renders user menu avatar", async ({ authedPage }) => {
    const { page } = authedPage;

    const bottomNav = page.getByRole("toolbar", {
      name: /mobile quick actions/i,
    });
    const profileButton = bottomNav.getByRole("button", { name: /user menu/i });

    await expect(profileButton).toBeVisible();
    await expect(profileButton).toContainText("PU"); // PU for Playwright User
  });
});
