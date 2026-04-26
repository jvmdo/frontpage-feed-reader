import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("navigation between articles and read status tracking", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // 1. Seed a feed with multiple items
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Nav Test Feed",
  });

  const now = new Date();
  await seedFeedItems(db, feed.id, [
    {
      title: "Article 1 (Newest)",
      publishedAt: new Date(now.getTime() - 1000),
    },
    {
      title: "Article 2 (Middle)",
      publishedAt: new Date(now.getTime() - 2000),
    },
    {
      title: "Article 3 (Oldest)",
      publishedAt: new Date(now.getTime() - 3000),
    },
  ]);

  // 2. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Verify all are unread initially
  await expect(
    page.locator("article").filter({ hasText: /Article 1/i }),
  ).toContainText(/\bunread\b/i);
  await expect(
    page.locator("article").filter({ hasText: /Article 2/i }),
  ).toContainText(/\bunread\b/i);
  await expect(
    page.locator("article").filter({ hasText: /Article 3/i }),
  ).toContainText(/\bunread\b/i);

  // 3. Open the first article
  await page
    .locator("article")
    .filter({ hasText: /Article 1/i })
    .click();
  const sheet = page.getByRole("dialog").filter({ visible: true });
  await expect(sheet).toBeVisible();

  // Article 1 should now be read in dashboard
  await expect(
    page.locator("article").filter({ hasText: /Article 1/i }),
  ).not.toContainText(/\bunread\b/i);

  // 4. Navigate to Next (Article 2) via Button
  await sheet.getByRole("button", { name: /next article/i }).click();
  await expect(
    sheet.getByRole("heading", { name: "Article 2 (Middle)" }),
  ).toBeVisible();

  // Verify Article 2 is now marked read in dashboard
  await expect(
    page.locator("article").filter({ hasText: /Article 2/i }),
  ).not.toContainText(/\bunread\b/i);

  // 5. Navigate to Next (Article 3) via Keyboard 'j'
  await page.keyboard.press("j");
  await expect(
    sheet.getByRole("heading", { name: "Article 3 (Oldest)" }),
  ).toBeVisible();

  // Verify Article 3 is now marked read in dashboard
  await expect(
    page.locator("article").filter({ hasText: /Article 3/i }),
  ).not.toContainText(/\bunread\b/i);
});
