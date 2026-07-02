import crypto from "node:crypto";
import {
  type BrowserContext,
  test as baseTest,
  expect,
  type Page,
} from "@playwright/test";
import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import { feeds, session } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createPlaywrightSession } from "@/tests/session";

type Fixtures = {
  authedPage: { page: Page; userId: string };
  onboardingPage: { page: Page; userId: string };
  guestTracker: {
    trackCurrentUser: (context: BrowserContext) => Promise<void>;
  };
};

export const test = baseTest.extend<Fixtures>({
  authedPage: async ({ page, context }, use) => {
    const uniqueId = crypto.randomUUID();
    const { testCookies, authTest } = await createPlaywrightSession(uniqueId);

    // Inject the cookie directly into Playwright's browser context (for prod compatibility)
    await context.addCookies(testCookies);

    // Disable the welcome tour via local storage
    await context.addInitScript(() => {
      window.localStorage.setItem(
        "frontpage_welcome_tour",
        JSON.stringify({
          state: { isTourCompleted: true },
          version: 0,
        }),
      );
    });

    // Yield the perfectly authenticated, isolated page to our test
    await use({ page, userId: uniqueId });

    // TEARDOWN: Clean up ONLY this specific user's data after the test
    await authTest.deleteUser(uniqueId);
    await db.delete(feeds).where(like(feeds.url, `%tenant=${uniqueId}%`));
  },

  onboardingPage: async ({ page, context }, use) => {
    const uniqueId = crypto.randomUUID();
    const { testCookies, authTest } = await createPlaywrightSession(uniqueId);

    // Inject the cookie directly into Playwright's browser context
    await context.addCookies(testCookies);

    // ENSURE the welcome tour is ENABLED (clearing any accidental state)
    await context.addInitScript(() => {
      window.localStorage.setItem(
        "frontpage_welcome_tour",
        JSON.stringify({
          state: { isTourCompleted: false },
          version: 0,
        }),
      );
    });

    await use({ page, userId: uniqueId });

    // TEARDOWN
    await authTest.deleteUser(uniqueId);
    await db.delete(feeds).where(like(feeds.url, `%tenant=${uniqueId}%`));
  },

  // biome-ignore lint/correctness/noEmptyPattern: no prop is used
  guestTracker: async ({}, use) => {
    let guestUserId: string | undefined;

    await use({
      /**
       * CRITICAL: Always ensure the page has finished navigating (e.g. `await expect(page).toHaveURL(...)`)
       * before calling this function! Otherwise, you will hit a race condition where the server
       * hasn't set the session cookie yet, and the teardown will silently fail to clean up the user.
       */
      trackCurrentUser: async (context) => {
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
      },
    });

    if (guestUserId) {
      const { test: authTest } = await auth.$context;
      await authTest.deleteUser(guestUserId);
      await db.delete(feeds).where(like(feeds.url, `%tenant=${guestUserId}%`));
    }
  },
});

export { expect };
