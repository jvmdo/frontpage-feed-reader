import { eq } from "drizzle-orm";
import { db } from "@/db";
import { session } from "@/db/schema";
import { auth } from "@/lib/auth";
import { expect, test } from "./fixtures/test-extend";

test.describe("Session Features", () => {
  let guestUserId: string | undefined;

  test.afterEach(async () => {
    if (guestUserId) {
      const { test: authTest } = await auth.$context;
      await authTest.deleteUser(guestUserId);
      guestUserId = undefined;
    }
  });

  test("guest banner is visible for anonymous users", async ({
    page,
    context,
  }) => {
    // 1. Enter as guest
    await page.goto("/sign-in");
    await page.waitForSelector('body[data-hydrated="true"]');
    await page.getByRole("button", { name: /try as guest/i }).click();

    // 2. Capture guest ID for cleanup
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "better-auth.session_token",
    );
    if (sessionCookie) {
      const token = sessionCookie.value.split(".")[0];
      const dbSession = await db.query.session.findFirst({
        where: eq(session.token, token),
      });
      guestUserId = dbSession?.userId;
    }

    // 3. Verify banner visibility
    await expect(
      page.getByText(/you are using a guest session/i),
    ).toBeVisible();
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
});
