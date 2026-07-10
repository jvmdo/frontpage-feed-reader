import crypto from "node:crypto";
import { test as omegaTest } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { cleanupUserByEmail } from "@/tests/cleanup-user";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

const testUser = {
  name: "Profile E2E User",
  email: `profile-test-${crypto.randomUUID()}@example.com`,
  password: "password123",
  newPassword: "newpassword123",
};

let newEmail: string | null = null;
let testUserId: string | null = null;

test.afterAll(async () => {
  // 1. Delete associated feeds using the captured userId (since user is deleted in UI)
  if (testUserId) {
    const { like } = require("drizzle-orm");
    const { feeds } = require("@/db/schema");
    await db.delete(feeds).where(like(feeds.url, `%tenant=${testUserId}%`));
  }

  // 2. Clean up mock users by email in case the test failed before UI deletion
  await cleanupUserByEmail(testUser.email);
  if (newEmail) {
    await cleanupUserByEmail(newEmail);
  }
});

omegaTest("profile page management flow", async ({ page }) => {
  // Setup: Sign Up a new user to have a real credential account
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

  // Get the user ID from the database to seed some stats
  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, testUser.email),
  });

  if (!dbUser) {
    throw new Error("Created user not found in DB");
  }

  testUserId = dbUser.id;

  // Seed 1 category and 2 subscriptions so stats grid is populated
  await seedCategory(db, { userId: dbUser.id, name: "Tech News" });
  await seedFeedWithSubscription(db, dbUser.id, { title: "Feed 1" });
  await seedFeedWithSubscription(db, dbUser.id, { title: "Feed 2" });

  // 1. Go to profile page
  const userMenuBtn = page.getByRole("button", { name: /user menu/i }).first();

  await userMenuBtn.click();
  await page.getByRole("menuitem", { name: /profile/i }).click();
  await expect(page).toHaveURL(/\/profile/);
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Verify statistics grid counts
  await expect(
    page.getByRole("heading", { level: 2, name: /Subscriptions/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Categories/i }),
  ).toBeVisible();

  // 3. Update Name
  await page.getByLabel(/display name/i).fill("Updated Profile User");
  await page.getByRole("button", { name: /save changes/i }).click();

  // Verify success toast
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: /profile updated/i }),
  ).toBeVisible();
  // Verify user menu initials changed
  await expect(userMenuBtn).toContainText("UP"); // "Updated Profile" -> UP

  // 4. Change Password
  await page.getByLabel(/current password/i).fill(testUser.password);
  await page.getByLabel(/^new password$/i).fill("new-pass");
  await page.getByLabel(/confirm new password/i).fill("new-pass");
  await page.getByRole("button", { name: /change password/i }).click();

  // Verify success toast
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /password changed/i }),
  ).toBeVisible();

  // 5. Change Email Address
  newEmail = `profile-test-updated-${crypto.randomUUID()}@example.com`;
  await page.getByLabel(/new email address/i).fill(newEmail);
  await page.getByLabel(/confirm password/i).fill("new-pass");
  await page.getByRole("button", { name: /update email/i }).click();

  // Verify success toast
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /email address updated/i }),
  ).toBeVisible();
  // Verify reactivity
  await expect(page.getByText(newEmail)).toBeVisible();

  // 6. Delete User
  await page.getByRole("button", { name: /delete account/i }).click();
  await page
    .getByRole("alertdialog")
    .getByLabel(/confirm password/i)
    .fill("new-pass");
  await page.getByRole("button", { name: /yes, delete my account/i }).click();

  // Verify redirect to the landing page
  await expect(page).toHaveURL("/");
});

test("password setup flow for user without credentials", async ({
  authedPage,
}) => {
  const { page } = authedPage;

  await page.goto("/profile");
  await page.waitForSelector('body[data-hydrated="true"]');

  // Verify form title is "Set Password"
  await expect(
    page.getByRole("heading", { level: 2, name: /set password/i }),
  ).toBeVisible();

  // Fill in new password
  await page.getByLabel(/^new password$/i).fill("newpassword123");
  await page.getByLabel(/confirm new password/i).fill("newpassword123");
  await page.getByRole("button", { name: /set password/i }).click();

  // Verify success toast
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /password set successfully/i }),
  ).toBeVisible();

  // After setting, the form should change to "Change Password" and current password field should appear
  await expect(
    page.getByText("Change Password", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel(/current password/i)).toBeVisible();
});
