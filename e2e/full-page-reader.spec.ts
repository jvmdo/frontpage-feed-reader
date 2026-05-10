import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("transition from sheet to full page and back to dashboard", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with an item
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Full Page Test Feed",
  });

  const [item] = await seedItems(db, feed.id, [
    {
      title: "Test Item For Full Page",
      url: "https://example.com/full-page-test",
      content: "<p>Focused content for full page reader.</p>",
      publishedAt: new Date(),
    },
  ]);

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  const itemCard = page.getByRole("article", {
    name: /test item for full page/i,
  });

  await expect(itemCard).toBeVisible();

  // 2. Open the sheet
  await itemCard.click();
  const sheet = page.getByRole("dialog", { name: /item reader/i });
  await expect(sheet).toBeVisible();

  // 3. Click "Full Page" button
  // Use exact: true to avoid collision with "Read full item on..." link
  const fullPageButton = sheet.getByRole("link", { name: /full page$/i });
  await expect(fullPageButton).toBeVisible();
  await fullPageButton.click();

  // 4. Verify URL is now the dedicated item page
  await expect(page).toHaveURL(new RegExp(`/items/${item.id}`));

  // 5. Verify content is visible in the full page
  await expect(
    page.getByRole("heading", { name: "Test Item For Full Page" }),
  ).toBeVisible();
  await expect(
    page.getByText("Focused content for full page reader."),
  ).toBeVisible();

  // 6. Navigate back via the "Back to Dashboard" button
  const backButton = page.getByRole("link", { name: /back to dashboard/i });
  await expect(backButton).toBeVisible();
  await backButton.click();

  // 7. Verify we are back on the dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(itemCard).toBeVisible();
});

test("full page reader preserves filters when going back", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed with an item
  const { feed } = await seedFeedWithSubscription(db, userId, {
    title: "Filtered Feed",
  });

  const [item] = await seedItems(db, feed.id, [
    {
      title: "Filtered Item",
      publishedAt: new Date(),
    },
  ]);

  // 1. Navigate to dashboard with a filter and wait for hydration
  await page.goto(`/dashboard?feedId=${feed.id}`);
  await page.waitForSelector('body[data-hydrated="true"]');

  const itemCard = page.getByRole("article", {
    name: /filtered item/i,
  });

  await expect(itemCard).toBeVisible();

  // 2. Open the sheet and transition to full page
  await itemCard.click();
  const sheet = page.getByRole("dialog", { name: /item reader/i });

  const fullPageButton = sheet.getByRole("link", { name: /full page$/i });
  await expect(fullPageButton).toBeVisible();
  await fullPageButton.click();

  // 3. Verify URL includes filters in the dedicated item page search params
  await expect(page).toHaveURL(
    new RegExp(`/items/${item.id}.*feedId=${feed.id}`),
  );

  // 4. Click back
  await page.getByRole("link", { name: /back to dashboard/i }).click();

  // 5. Verify we are back on the dashboard WITH the filter preserved
  await expect(page).toHaveURL(new RegExp(`/dashboard.*feedId=${feed.id}`));
  await expect(itemCard).toBeVisible();
});
