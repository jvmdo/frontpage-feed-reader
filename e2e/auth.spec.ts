import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { cleanupUserByEmail } from "@/tests/cleanup-user";

const email = `journey-${crypto.randomUUID()}@example.com`;
const testUser = {
  name: "Test User",
  email,
  password: "password123",
};

test.afterAll(async () => {
  await cleanupUserByEmail(testUser.email);
});

test("full journey: sign up, sign out, and sign in", async ({ page }) => {
  // 1. Sign Up
  await page.goto("/sign-up");
  await page.waitForSelector('body[data-hydrated="true"]');

  await page.getByLabel(/full name/i).fill(testUser.name);
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/^password$/i).fill(testUser.password);
  await page.getByLabel(/confirm password/i).fill(testUser.password);

  await page.getByRole("button", { name: /^create account$/i }).click();

  // Verify redirect to dashboard
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: /account created/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard/);

  // Dismiss welcome dialog
  await page
    .getByRole("alertdialog", { name: /welcome/i })
    .getByRole("button", { name: /later/i })
    .click();

  // 2. Sign Out
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: /log out/i }).click();

  // Verify redirect to sign-in
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: /logged out/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);

  // 3. Sign In
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/^password$/i).fill(testUser.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Verify redirect to dashboard and user initials
  await expect(page).toHaveURL(/\/dashboard/);

  // The UserMenu should show "TU" for "Test User"
  await expect(
    page.getByRole("button", { name: /user menu/i }).first(),
  ).toContainText("TU");
});

test("github button initiates redirect", async ({ page }) => {
  await page.goto("/sign-in");

  await page.route("**/api/auth/social/github**", async (route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ status: 200, body: "Redirect intercepted" });
  });

  await page.getByRole("button", { name: /github/i }).click();
});
