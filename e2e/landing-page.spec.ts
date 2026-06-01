import { expect, test } from "@playwright/test";

test.describe("Landing Page Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('body[data-hydrated="true"]');
  });

  test("can enter the app via 'Try as Guest' hero button", async ({ page }) => {
    // Target the button in the main hero section specifically
    const heroGuestButton = page
      .locator("main")
      .getByRole("button", { name: /try as guest/i })
      .first();

    await expect(heroGuestButton).toBeVisible();
    await heroGuestButton.click();

    // Verify navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("can navigate to sign-up page via 'Create Account' button", async ({
    page,
  }) => {
    const signUpButton = page
      .locator("main")
      .getByRole("link", { name: /create account/i })
      .first();

    await expect(signUpButton).toBeVisible();
    await signUpButton.click();

    // Verify navigation to sign-up
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();
  });
});
