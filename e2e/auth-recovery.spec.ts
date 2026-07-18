import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { verification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cleanupUserByEmail } from "@/tests/cleanup-user";

const testUser = {
  name: "Recovery User",
  email: `recovery-${crypto.randomUUID()}@example.com`,
  password: "initial-password",
  newPassword: "new-password-123",
};

test.afterAll(async () => {
  await cleanupUserByEmail(testUser.email);
});

test("password recovery flow", async ({ page }) => {
  const ctx = await auth.$context;
  const testUtils = ctx.test;

  // Setup: Create a real user via test utils (handles accounts/relations)
  const user = testUtils.createUser({
    email: testUser.email,
    name: testUser.name,
  });
  const savedUser = await testUtils.saveUser(user);

  // 1. Go to Sign In page
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Request Password Reset
  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);

  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByRole("button", { name: /send reset link/i }).click();

  await expect(page.getByText(/check your email/i)).toBeVisible();

  // Get the Token from the Database
  // Better Auth implementation detail:
  // - 'identifier' is formatted as "reset-password:TOKEN" (the raw token is the suffix)
  // - 'value' stores the user's ID to link the reset request
  let token: string | undefined;
  await expect
    .poll(
      async () => {
        const record = await db.query.verification.findFirst({
          where: and(
            eq(verification.value, savedUser.id),
            like(verification.identifier, "reset-password:%"),
          ),
          orderBy: [desc(verification.createdAt)],
        });
        if (record) {
          token = record.identifier.split(":")[1];
        }
        return record;
      },
      {
        message: "Verification record not found in DB",
        timeout: 10000,
      },
    )
    .toBeDefined();

  // 3 Verify missing token branch
  await page.goto("/reset-password");
  await page.waitForSelector('body[data-hydrated="true"]');
  await expect(
    page.getByRole("heading", { name: /invalid link/i }),
  ).toBeVisible();

  // 4. Navigate to Reset Password page using the extracted token
  await page.goto(`/reset-password?token=${token}`);
  await page.waitForSelector('body[data-hydrated="true"]');

  // 5. Reset Password via UI
  await page.getByLabel(/^new password$/i).fill(testUser.newPassword);
  await page.getByLabel(/confirm password/i).fill(testUser.newPassword);
  await page.getByRole("button", { name: /reset password/i }).click();

  // Verify Success
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /success|successfully/i }),
  ).toBeVisible();

  await expect(page).toHaveURL(/\/sign-in/);

  // 6. Sign In with New Password
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/^password$/i).fill(testUser.newPassword);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Verify successful login to dashboard
  await expect(page).toHaveURL(/\/dashboard/);
});
