import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { createPlaywrightSession } from "@/tests/session";

test("unauthenticated user accessing /dashboard is redirected to /sign-in", async ({
  page,
}) => {
  // Navigate to a dashboard subroute without any session cookie
  await page.goto("/dashboard");

  // Expect to be redirected to /sign-in with callbackUrl
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
});

test("authenticated user accessing /dashboard is NOT redirected", async ({
  context,
  page,
}) => {
  const uniqueId = `test-auth-guard-${crypto.randomUUID()}`;
  const { sessionToken, authTest } = await createPlaywrightSession(uniqueId);

  if (sessionToken) {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // Should stay on /dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // Cleanup
  await authTest.deleteUser(uniqueId);
});

test("authenticated user accessing /sign-in is redirected to /dashboard", async ({
  context,
  page,
}) => {
  const uniqueId = `test-sign-in-redirect-${crypto.randomUUID()}`;
  const { sessionToken, authTest } = await createPlaywrightSession(uniqueId);

  if (sessionToken) {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  await page.goto("/sign-in");

  // Should be redirected to /dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // Cleanup
  await authTest.deleteUser(uniqueId);
});

test("authenticated user accessing / is redirected to /dashboard", async ({
  context,
  page,
}) => {
  const uniqueId = `test-root-redirect-${crypto.randomUUID()}`;
  const { sessionToken, authTest } = await createPlaywrightSession(uniqueId);

  if (sessionToken) {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  await page.goto("/");

  // Should be redirected to /dashboard (handled by src/app/page.tsx)
  await expect(page).toHaveURL(/\/dashboard/);

  // Cleanup
  await authTest.deleteUser(uniqueId);
});
