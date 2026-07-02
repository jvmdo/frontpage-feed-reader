import { expect, test } from "./fixtures/test-extend";

test("guest banner is visible for anonymous users", async ({
  page,
  context,
  guestTracker,
}) => {
  // 1. Enter as guest
  await page.goto("/sign-in");
  await page.waitForSelector('body[data-hydrated="true"]');
  await page.getByRole("button", { name: /try as guest/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // 2. Capture guest ID for cleanup
  await guestTracker.trackCurrentUser(context);

  // 3. Verify banner visibility
  await expect(page.getByText(/you are using a guest session/i)).toBeVisible();
});

test("guest banner is hidden for regular members", async ({ authedPage }) => {
  const { page } = authedPage;

  // 1. Navigate to dashboard as a regular member
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Verify banner is NOT visible
  await expect(
    page.getByText(/you are using a guest session/i),
  ).not.toBeVisible();
});
