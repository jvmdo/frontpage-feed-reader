import crypto from "node:crypto";
import { test as baseTest, expect, type Page } from "@playwright/test";
import { like } from "drizzle-orm";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { createPlaywrightSession } from "@/tests/session";

type Fixtures = {
  authedPage: { page: Page; userId: string };
};

export const test = baseTest.extend<Fixtures>({
  authedPage: async ({ page, context, baseURL }, use) => {
    const uniqueId = crypto.randomUUID();
    const { sessionToken, authTest } = await createPlaywrightSession(uniqueId);

    // Inject the cookie directly into Playwright's browser context (for prod compatibility)
    if (sessionToken) {
      await context.addCookies([
        {
          name: "better-auth.session_token",
          value: sessionToken,
          domain: new URL(baseURL!).hostname,
          path: "/",
        },
      ]);
    }

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
});

export { expect };
