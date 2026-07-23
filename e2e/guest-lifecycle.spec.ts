import crypto from "node:crypto";
import { db } from "@/db";
import { seedCuratedFeeds } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.beforeAll(async () => {
  // Pre-seed the feeds table
  await seedCuratedFeeds(db);
});

test("full guest-to-member conversion journey", async ({
  page,
  context,
  guestTracker,
}) => {
  // 1. Try as Guest
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');

  await page.getByRole("button", { name: /try as guest/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  // Track the guest user for cleanup
  await guestTracker.trackCurrentUser(context);

  // Dismiss welcome dialog
  await page
    .getByRole("alertdialog", { name: /welcome/i })
    .getByRole("button", { name: /later/i })
    .click();

  // Should see pre-populated curated categories
  const sidebar = page.locator('[data-slot="sidebar"]');
  const frontendCategory = sidebar.getByRole("link", {
    name: /frontend/i,
  });

  await expect(frontendCategory).toBeVisible();
  await expect(
    sidebar.getByRole("link", { name: /css-tricks/i }),
  ).toBeVisible();

  // 2. Interact with content

  const main = page.getByRole("main");
  const firstArticle = main.getByRole("article").first();

  await frontendCategory.click();
  await expect(firstArticle.getByRole("heading", { level: 3 })).toBeVisible();

  // 3. Convert to full account
  const guestBanner = page.getByText(/you are using a guest session/i);
  await expect(guestBanner).toBeVisible();

  await page.getByRole("button", { name: /click to keep/i }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /create an account/i }),
  ).toBeVisible();

  const email = `guest-convert-${crypto.randomUUID()}@example.com`;
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill("password123");

  await page.getByRole("button", { name: /create account/i }).click();

  // Conversion happens in-place, banner should disappear
  await expect(guestBanner).not.toBeVisible();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /account created successfully/i }),
  ).toBeVisible();

  // 4. Verify conversion via UI
  // Open menu
  await page.getByRole("button", { name: /user menu/i }).click();

  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: /save progress/i }),
  ).not.toBeVisible();

  // Close menu
  await page.keyboard.press("Escape");

  // 5. Verify data preservation
  await frontendCategory.click(); // Expand category
  await expect(
    sidebar.getByRole("link", { name: /css-tricks/i }),
  ).toBeVisible();

  await expect(firstArticle.getByRole("heading", { level: 3 })).toBeVisible();
});

test("guest can explicitly sign out and lose data", async ({
  page,
  context,
  guestTracker,
}) => {
  // 1. Try as Guest
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');
  await page.getByRole("button", { name: /try as guest/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Track the guest user for cleanup
  await guestTracker.trackCurrentUser(context);

  // Dismiss welcome dialog
  await page
    .getByRole("alertdialog", { name: /welcome/i })
    .getByRole("button", { name: /later/i })
    .click();

  // 2. Trigger Logout
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: /log out/i }).click();

  // 3. The Alert Dialog should appear
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();

  // 4. Confirm destructive action
  await dialog.getByRole("button", { name: /yes/i }).click();

  // 5. Verify redirection
  await expect(page).toHaveURL(/\/sign-in/);
});

test("guest transition overlay is rendered during delayed sign in", async ({
  page,
  context,
  guestTracker,
}) => {
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');

  const { promise, resolve } = Promise.withResolvers<void>();

  await page.route("**/api/auth/sign-in/anonymous", async (route) => {
    await promise;
    await route.continue();
  });

  await page.getByRole("button", { name: /try as guest/i }).click();

  // Overlay dialog should become visible when request is held
  const overlay = page.getByRole("dialog", {
    name: /setting up your guest workspace/i,
  });
  await expect(overlay).toBeVisible();

  // Unpause request and verify navigation to dashboard
  resolve();

  await expect(page).toHaveURL(/\/dashboard/);
  await guestTracker.trackCurrentUser(context);
});
