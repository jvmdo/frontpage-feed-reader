import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { session } from "@/db/schema";
import { auth } from "@/lib/auth";
import { seedCuratedFeeds } from "@/tests/seeding";

let userToCleanup: string | undefined;

test.beforeAll(async () => {
  // Pre-seed the feeds table
  await seedCuratedFeeds(db);
});

test.afterEach(async () => {
  if (userToCleanup) {
    const { test: authTest } = await auth.$context;
    await authTest.deleteUser(userToCleanup);
    userToCleanup = undefined;
  }
});

test("full guest-to-member conversion journey", async ({ page, context }) => {
  // 1. Try as Guest
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');

  await page.getByRole("button", { name: /try as guest/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  // Deterministically get the ID of the anonymous user from session cookie
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(
    (c) => c.name === "better-auth.session_token",
  );
  if (!sessionCookie) throw new Error("Session cookie not found");

  // Better Auth format is token.signature
  const token = sessionCookie.value.split(".")[0];
  const dbSession = await db.query.session.findFirst({
    where: eq(session.token, token),
  });

  if (!dbSession) throw new Error("Session not found in DB");

  userToCleanup = dbSession.userId;

  // Should see pre-populated curated categories
  const sidebar = page.locator('[data-slot="sidebar"]');
  const gettingStartedCategory = sidebar.getByRole("link", {
    name: /getting started/i,
  });

  await expect(gettingStartedCategory).toBeVisible();

  // Click category to expand it
  await gettingStartedCategory.click();
  await expect(sidebar.getByRole("link", { name: /frontpage/i })).toBeVisible();

  // 2. Interact with content
  const main = page.getByRole("main");
  const firstArticle = main.getByRole("article").first();

  await expect(firstArticle.getByRole("heading", { level: 3 })).toContainText(
    /Welcome to Frontpage/i,
  );

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

  await page.getByRole("button", { name: /create account/i }).click();

  // Conversion happens in-place, banner should disappear
  await expect(guestBanner).not.toBeVisible();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /account created successfully/i }),
  ).toBeVisible();

  // 4. Verify conversion via UI
  await page.getByRole("button", { name: /user menu/i }).click();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /profile/i })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: /save progress/i }),
  ).not.toBeVisible();

  // Close menu
  await page.keyboard.press("Escape");

  // 5. Verify data preservation
  await expect(sidebar.getByRole("link", { name: /frontpage/i })).toBeVisible();

  await expect(
    main.getByRole("article").filter({ hasText: /Welcome to Frontpage/i }),
  ).toBeVisible();
});
