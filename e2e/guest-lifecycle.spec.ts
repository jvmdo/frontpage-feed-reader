import crypto from "node:crypto";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedItems, feeds, session, user } from "@/db/schema";
import sampleFeeds from "../data/sample-feeds.json";

test.describe("Guest Lifecycle", () => {
  test.beforeAll(async () => {
    // Pre-seed the feeds table so onboarding doesn't make network calls
    for (const category of sampleFeeds.categories) {
      for (const feedData of category.feeds) {
        const [feed] = await db
          .insert(feeds)
          .values({
            url: feedData.feedUrl,
            title: feedData.title,
            description: feedData.description,
            healthStatus: "healthy",
          })
          .onConflictDoUpdate({
            target: feeds.url,
            set: { title: feedData.title },
          })
          .returning();

        if (feedData.title === "Smashing Magazine") {
          await db
            .insert(feedItems)
            .values({
              feedId: feed.id,
              guid: "seed-smash-1",
              title: "Seeded Smashing Article",
              url: "https://smashingmagazine.com/seeded",
              publishedAt: new Date(),
            })
            .onConflictDoNothing();
        }
      }
    }
  });

  test("full guest-to-member conversion journey", async ({ page, context }) => {
    // 1. Try as Guest
    await page.goto("/sign-in");
    await page.waitForSelector('body[data-hydrated="true"]');

    // Click Guest button
    await page.getByRole("button", { name: /try as guest/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Deterministically get the ID of the anonymous user from session cookie
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === "better-auth.session_token");
    if (!sessionCookie) throw new Error("Session cookie not found");
    
    // BA format is token.signature
    const token = sessionCookie.value.split(".")[0];
    const dbSession = await db.query.session.findFirst({
      where: eq(session.token, token)
    });
    
    if (!dbSession) throw new Error("Session not found in DB");
    const anonId = dbSession.userId;

    // Should see pre-populated curated categories
    const sidebar = page.locator('[data-slot="sidebar"]');
    const frontendCategory = sidebar.getByRole("link", { name: /frontend/i });
    await expect(frontendCategory).toBeVisible();

    // Click category to expand it
    await frontendCategory.click();

    // Now should see smashing magazine
    await expect(
      sidebar.getByRole("link", { name: /smashing magazine/i }),
    ).toBeVisible();

    // 2. Interact with content
    const main = page.getByRole("main");
    const firstArticle = main.getByRole("article").first();
    await expect(firstArticle).toBeVisible();

    // Use a locator that finds the text specifically
    const articleHeading = firstArticle.getByRole("heading", { level: 3 });
    await expect(articleHeading).toContainText("Seeded Smashing Article");

    await firstArticle.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(firstArticle).toHaveClass(/opacity-60/);

    // 3. Convert to full account
    await page.goto("/sign-up");
    await page.waitForSelector('body[data-hydrated="true"]');

    const email = `guest-convert-${crypto.randomUUID()}@example.com`;
    await page.getByLabel(/full name/i).fill("Converted Guest");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill("password123");
    await page.getByLabel(/confirm password/i).fill("password123");

    await page.getByRole("button", { name: /^create account$/i }).click();

    // Sign up triggers full page reload to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForSelector('body[data-hydrated="true"]');
    
    // Verify User ID remains constant
    const convertedUser = await db.query.user.findFirst({
      where: eq(user.email, email)
    });
    expect(convertedUser?.id).toBe(anonId);
    expect(convertedUser?.isAnonymous).toBe(false);

    // 4. Verify data preservation
    await expect(
      sidebar.getByRole("link", { name: /frontend/i }),
    ).toBeVisible();

    await sidebar.getByRole("link", { name: /frontend/i }).click();
    await expect(
      sidebar.getByRole("link", { name: /smashing magazine/i }),
    ).toBeVisible();

    const movedArticle = main
      .getByRole("article")
      .filter({ hasText: "Seeded Smashing Article" });

    // Assert on final state
    await expect(movedArticle).toHaveClass(/opacity-60/);

    // Cleanup
    await db.delete(user).where(eq(user.id, anonId));
  });
});
