import crypto from "node:crypto";
import { eq, like } from "drizzle-orm";
import { db } from "@/db";
import { feeds, user } from "@/db/schema";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
  seedUser,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

/**
 * Data Isolation Verification
 *
 * This suite ensures that User B (Attacker) cannot access or modify User A's (Victim) data.
 * It verifies the multi-tenant hardening implemented in Phase 7 Step 5.
 */

test.describe("Data Isolation", () => {
  let victimId: string;

  test.beforeEach(async () => {
    victimId = `victim-${crypto.randomUUID()}`;
    await seedUser(db, { id: victimId, name: "Victim User" });
  });

  test.afterEach(async () => {
    // Cleanup victim data
    await db.delete(user).where(eq(user.id, victimId));
    await db.delete(feeds).where(like(feeds.url, `%tenant=${victimId}%`));
  });

  test("User B cannot see User A's category via URL parameters", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    // 1. Setup: Victim has a private category
    const categoryName = `Secret Category ${crypto.randomUUID()}`;
    const victimCategory = await seedCategory(db, {
      userId: victimId,
      name: categoryName,
    });

    // 2. Attacker navigates to their dashboard
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Attacker attempts to filter by Victim's category ID via URL
    await page.goto(`/dashboard?categoryId=${victimCategory.id}`);
    await page.waitForSelector('body[data-hydrated="true"]');

    // 4. Verify: The title should default to "All Items" because the category doesn't belong to the Attacker
    const toolbar = page.locator('header[role="toolbar"]');
    await expect(toolbar.getByRole("heading")).toHaveText("All Items");
    await expect(toolbar.getByText(categoryName)).not.toBeVisible();

    // 5. Verify: Attacker does not see the category in the sidebar
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar.getByText(categoryName)).not.toBeVisible();
  });

  test("User B cannot see items from a feed only User A is subscribed to", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    // 1. Setup: Victim is subscribed to a feed with private items
    const feedTitle = `Private Feed ${crypto.randomUUID()}`;
    const itemTitle = `Secret Item ${crypto.randomUUID()}`;
    const { feed } = await seedFeedWithSubscription(db, victimId, {
      title: feedTitle,
      url: `https://example.com/feed.xml?tenant=${victimId}`,
    });
    await seedItems(db, feed.id, [{ title: itemTitle, guid: "item-1" }]);

    // 2. Attacker navigates to their dashboard
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Verify: Attacker should not see the secret item in "All Items"
    await expect(page.getByText(itemTitle)).not.toBeVisible();

    // 4. Attacker attempts to filter by Victim's feed ID via URL
    await page.goto(`/dashboard?feedId=${feed.id}`);
    await page.waitForSelector('body[data-hydrated="true"]');

    // 5. Verify: Title should be "All Items" and no items shown
    const toolbar = page.locator('header[role="toolbar"]');
    await expect(toolbar.getByRole("heading")).toHaveText("All Items");
    await expect(page.getByText(itemTitle)).not.toBeVisible();
  });

  test("User B cannot manage User A's categories", async ({ authedPage }) => {
    const { page } = authedPage;

    // 1. Setup: Victim has a category
    const categoryName = `Victim Category ${crypto.randomUUID()}`;
    await seedCategory(db, {
      userId: victimId,
      name: categoryName,
    });

    // 2. Attacker goes to Manage Categories page
    await page.goto("/manage-categories");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Verify: Victim's category is NOT listed
    await expect(page.getByText(categoryName)).not.toBeVisible();
    await expect(
      page.getByRole("main").getByText(/no categories yet/i),
    ).toBeVisible();
  });

  test("User B cannot manage User A's feeds", async ({ authedPage }) => {
    const { page } = authedPage;

    // 1. Setup: Victim has a subscription
    const feedTitle = `Victim Feed ${crypto.randomUUID()}`;
    await seedFeedWithSubscription(db, victimId, {
      title: feedTitle,
      url: `https://example.com/victim.xml?tenant=${victimId}`,
    });

    // 2. Attacker goes to Manage Feeds page
    await page.goto("/manage-feeds");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Verify: Victim's feed is NOT listed
    await expect(page.getByText(feedTitle)).not.toBeVisible();
    await expect(
      page.getByRole("main").getByText(/no feeds yet/i),
    ).toBeVisible();
  });

  test("User switching (logout and login B) does not leak User A's feeds in sidebar", async ({
    authedPage,
  }) => {
    const { page, userId: userAId } = authedPage;

    // 1. Setup: User A is subscribed to a unique feed
    const feedTitleA = `User A Feed ${crypto.randomUUID()}`;
    await seedFeedWithSubscription(db, userAId, {
      title: feedTitleA,
      url: `https://example.com/usera.xml?tenant=${userAId}`,
    });

    // 2. User A goes to dashboard and verifies their feed is visible
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');
    await expect(page.getByText(feedTitleA)).toBeVisible();

    // 3. User A logs out
    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL("**/sign-in");

    // 4. User B signs up
    const emailB = `isolation-b-${crypto.randomUUID()}@example.com`;
    const nameB = "User B";
    const passwordB = "password123";

    await page.goto("/sign-up");
    await page.waitForSelector('body[data-hydrated="true"]');
    await page.getByLabel(/full name/i).fill(nameB);
    await page.getByLabel(/email/i).fill(emailB);
    await page.getByLabel(/^password$/i).fill(passwordB);
    await page.getByLabel(/confirm password/i).fill(passwordB);
    await page.getByRole("button", { name: /^create account$/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // Dismiss welcome dialog for User B if it appears
    const laterButton = page.getByRole("button", { name: /later/i });
    if (await laterButton.isVisible()) {
      await laterButton.click();
    }

    // 5. Verify: User A's feed is NOT visible in User B's sidebar
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar.getByText(feedTitleA)).not.toBeVisible();

    // Cleanup User B
    await db.delete(user).where(eq(user.email, emailB));
  });
});
