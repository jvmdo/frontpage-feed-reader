import { expect, test } from "./fixtures/test-extend";

test("unauthenticated user accessing /dashboard is redirected to /sign-in", async ({
  page,
}) => {
  // Navigate to a dashboard subroute without any session cookie
  await page.goto("/dashboard");

  // Expect to be redirected to /sign-in with callbackUrl
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
});

test("authenticated user accessing /dashboard is NOT redirected", async ({
  authedPage,
}) => {
  const { page } = authedPage;
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // Should stay on /dashboard
  await expect(page).toHaveURL(/\/dashboard/);
});

test("authenticated user accessing /sign-in is redirected to /dashboard", async ({
  authedPage,
}) => {
  const { page } = authedPage;
  await page.goto("/sign-in");

  // Should be redirected to /dashboard
  await expect(page).toHaveURL(/\/dashboard/);
});

test("authenticated user accessing / is redirected to /dashboard", async ({
  authedPage,
}) => {
  const { page } = authedPage;
  await page.goto("/");

  // Should be redirected to /dashboard (handled by src/app/page.tsx)
  await expect(page).toHaveURL(/\/dashboard/);
});
