import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("loads filtered state directly from URL with prefetched data", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed two different feeds and subscriptions
  const { feed: feed1 } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed1.com/rss?tenant=${userId}`,
    title: "First Tech Feed",
  });

  const { feed: feed2 } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed2.com/rss?tenant=${userId}`,
    title: "Second Design Feed",
  });

  // Seed Items for both
  await seedItems(db, feed1.id, [
    {
      guid: `item-f1-${userId}`,
      title: "Article from First Feed",
    },
  ]);

  await seedItems(db, feed2.id, [
    {
      guid: `item-f2-${userId}`,
      title: "Article from Second Feed",
    },
  ]);

  // 1. Navigate DIRECTLY to feed 1 filtered URL
  await page.goto(`/dashboard?feedId=${feed1.id}`);

  // 2. Verify immediate content (no loading flash)
  const skeleton = page.getByRole("status", { name: /loading items/i });
  const firstItem = page.getByRole("heading", {
    name: "Article from First Feed",
  });

  await expect(firstItem).toBeVisible();
  await expect(skeleton).not.toBeVisible();

  // 3. Verify isolation
  const secondItem = page.getByRole("heading", {
    name: "Article from Second Feed",
  });

  await expect(secondItem).not.toBeVisible();

  // 4. Verify header title
  const headerTitle = page.getByRole("heading", { level: 1 });

  await expect(headerTitle).toHaveText(/First Tech Feed/i);
});

test("full flow: click feed -> updates UI -> click All Items -> resets UI", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup Seed data
  const { feed: feedA } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed-a.com/rss?tenant=${userId}`,
    title: "Feed A",
  });

  const { feed: feedB } = await seedFeedWithSubscription(db, userId, {
    url: `https://feed-b.com/rss?tenant=${userId}`,
    title: "Feed B",
  });

  await seedItems(db, feedA.id, [
    {
      guid: `item-a-${userId}`,
      title: "Item A",
    },
  ]);

  await seedItems(db, feedB.id, [
    {
      guid: `item-b-${userId}`,
      title: "Item B",
    },
  ]);

  // 1. Navigate to Dashboard
  // Despite there's a click interaction, no explicit wait for hydration is needed because it's a Link
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: /All Items/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();

  // 2. Click Feed A in sidebar
  await page.getByRole("link", { name: "Feed A" }).click();

  // 3. Verify updates
  await expect(page).toHaveURL(new RegExp(`feedId=${feedA.id}`));
  await expect(page.getByRole("heading", { name: /Feed A/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item B" })).not.toBeVisible();

  // 4. Click All Items to reset
  await page.getByRole("link", { name: "All Items" }).click();

  // 5. Verify reset
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: /All Items/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();
});
