import { db } from "@/db";
import { seedFeedItems, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Feed Filtering", () => {
  test("loads filtered state directly from URL with prefetched data", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed two different feeds and subscriptions
    const { feed: feed1 } = await seedFeedWithSubscription(db, userId, {
      url: `https://feed1.com/rss?tenant=${userId}`,
      title: "First Tech Feed",
    });

    const { feed: feed2 } = await seedFeedWithSubscription(db, userId, {
      url: `https://feed2.com/rss?tenant=${userId}`,
      title: "Second Design Feed",
    });

    // 2. Seed Items for both
    await seedFeedItems(db, feed1.id, [
      {
        guid: `item-f1-${userId}`,
        title: "Article from First Feed",
      },
    ]);

    await seedFeedItems(db, feed2.id, [
      {
        guid: `item-f2-${userId}`,
        title: "Article from Second Feed",
      },
    ]);

    // 3. Navigate DIRECTLY to feed 1 filtered URL
    await page.goto(`/dashboard?feedId=${feed1.id}`);

    // 4. Verify immediate content (no loading flash)
    const firstFeedItem = page.getByRole("heading", {
      name: "Article from First Feed",
    });
    const skeleton = page.getByLabel("Loading feed items...");

    await expect(firstFeedItem).toBeVisible();
    await expect(skeleton).not.toBeVisible();

    // 5. Verify isolation
    const secondFeedItem = page.getByRole("heading", {
      name: "Article from Second Feed",
    });
    await expect(secondFeedItem).not.toBeVisible();

    // 6. Verify header title
    const headerTitle = page.getByRole("heading", { level: 1 });
    await expect(headerTitle).toHaveText(/First Tech Feed/i);
  });

  test("full flow: click feed -> updates UI -> click All Items -> resets UI", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed data
    const { feed: feedA } = await seedFeedWithSubscription(db, userId, {
      url: `https://feed-a.com/rss?tenant=${userId}`,
      title: "Feed A",
    });

    const { feed: feedB } = await seedFeedWithSubscription(db, userId, {
      url: `https://feed-b.com/rss?tenant=${userId}`,
      title: "Feed B",
    });

    await seedFeedItems(db, feedA.id, [
      {
        guid: `item-a-${userId}`,
        title: "Item A",
      },
    ]);

    await seedFeedItems(db, feedB.id, [
      {
        guid: `item-b-${userId}`,
        title: "Item B",
      },
    ]);

    // 2. Start at All Items
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /All Items/i,
    );
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();

    // 3. Click Feed A in sidebar
    await page.getByRole("link", { name: "Feed A" }).click();

    // 4. Verify updates
    await expect(page).toHaveURL(new RegExp(`feedId=${feedA.id}`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Feed A/i);
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Item B" }),
    ).not.toBeVisible();

    // 5. Click All Items to reset
    await page.getByRole("link", { name: "All Items" }).click();

    // 6. Verify reset
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /All Items/i,
    );
    await expect(page.getByRole("heading", { name: "Item A" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Item B" })).toBeVisible();
  });
});
