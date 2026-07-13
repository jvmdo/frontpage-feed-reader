import { db } from "@/db";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
  seedUserItemState,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Bookmarks / Save for Later", () => {
  test("full flow: bookmarking, viewing, filtering, and removing", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed categories and feeds with items
    const cat1 = await seedCategory(db, {
      userId,
      name: "Tech",
      color: "#ff0000",
    });
    const cat2 = await seedCategory(db, {
      userId,
      name: "News",
      color: "#00ff00",
    });

    const { feed: f1 } = await seedFeedWithSubscription(
      db,
      userId,
      { title: "Hacker News" },
      { categoryId: cat1.id },
    );
    const { feed: f2 } = await seedFeedWithSubscription(
      db,
      userId,
      { title: "Verge" },
      { categoryId: cat2.id },
    );

    const [_item1] = await seedItems(db, f1.id, [
      { title: "Saved Tech Item", publishedAt: new Date() },
    ]);
    const [_item2] = await seedItems(db, f2.id, [
      { title: "Saved News Item", publishedAt: new Date() },
    ]);

    // 2. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Bookmark items from the list
    const card1 = page
      .locator("article")
      .filter({ hasText: "Saved Tech Item" });
    const card2 = page
      .locator("article")
      .filter({ hasText: "Saved News Item" });

    await card1.getByRole("button", { name: /save for later/i }).click();
    await expect(
      card1.getByRole("button", { name: /remove from saved/i }),
    ).toBeVisible();

    await card2.getByRole("button", { name: /save for later/i }).click();
    await expect(
      card2.getByRole("button", { name: /remove from saved/i }),
    ).toBeVisible();

    // 4. Navigate to Saved view via sidebar
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("link", { name: /saved/i }).click();

    // URL should update
    await expect(page).toHaveURL(/\/dashboard\?saved=true/);

    // Both items should be visible
    await expect(page.getByText("Saved Tech Item")).toBeVisible();
    await expect(page.getByText("Saved News Item")).toBeVisible();

    // 5. Advanced Filtering: Filter by Category (Tech)
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: /^Tech$/i }).click();

    // Should show Category chip and ONLY Tech item
    await expect(page.getByText("Category: Tech")).toBeVisible();
    await expect(page.getByText("Saved Tech Item")).toBeVisible();
    await expect(page.getByText("Saved News Item")).not.toBeVisible();

    // 6. State Compaction: Select all feeds in News category
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: /Verge/i }).click();

    // Should show both Category chips
    await expect(page.getByText("Category: Tech")).toBeVisible();
    await expect(page.getByText("Category: News")).toBeVisible();
    await expect(page.getByText("Saved News Item")).toBeVisible();

    // 7. Refinement: Uncheck Tech category from dropdown
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: /^Tech$/i }).click();

    await expect(page.getByText("Category: Tech")).not.toBeVisible();
    await expect(page.getByText("Saved Tech Item")).not.toBeVisible();
    await expect(page.getByText("Saved News Item")).toBeVisible();

    // 8. Removal via Chip
    await page
      .getByRole("button", { name: /remove category: news filter/i })
      .click();

    // Back to all saved items
    await expect(page.getByText("Saved Tech Item")).toBeVisible();
    await expect(page.getByText("Saved News Item")).toBeVisible();

    // 9. Remove bookmark
    await card1.getByRole("button", { name: /remove from saved/i }).click();
    await expect(page.getByText("Saved Tech Item")).not.toBeVisible();

    // Sidebar unread count for saved should update (optimistically then actually)
    // (This assumes items were seeded as unread)
    const savedBadge = sidebar
      .locator("li")
      .filter({ hasText: "Saved" })
      .locator('[data-slot="sidebar-menu-badge"]');
    await expect(savedBadge).toHaveText("1");
  });

  test("should correctly filter items after marking a read bookmark as unread", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Seed a feed subscription and an item that is bookmarked and read
    const { feed } = await seedFeedWithSubscription(db, userId, {
      title: "E2E Test Feed",
    });
    const [item] = await seedItems(db, feed.id, [
      { title: "Bug Triggering Item", publishedAt: new Date() },
    ]);
    await seedUserItemState(db, {
      userId,
      itemId: item.id,
      readAt: new Date(),
      bookmarkedAt: new Date(),
    });

    // 2. Navigate to Saved view
    await page.goto("/dashboard?saved=true");
    await page.waitForSelector('body[data-hydrated="true"]');

    // Item should be visible
    const article = page
      .locator("article")
      .filter({ hasText: "Bug Triggering Item" });
    await expect(article).toBeVisible();

    // 3. Filter by Read only
    await page.getByRole("button", { name: /Filter/ }).click();
    await page
      .getByRole("menuitemradio", { name: "Read only", exact: true })
      .click();

    // Verify it is loaded and listed
    await expect(page).toHaveURL(/status=read/);
    await expect(article).toBeVisible();

    // 4. Mark the item as unread
    // Press 'j' to set focusedIndex, then 'm' to toggle read status
    await page.keyboard.press("j");
    await page.keyboard.press("m");

    // The item should still be visible because we do not instantly jump/remove (good UX)
    await expect(article).toBeVisible();
    await expect(article).toContainText(/\bunread\b/i);

    // 5. Change filter to 'All items'
    await page.getByRole("button", { name: /Filter/ }).click();
    await page
      .getByRole("menuitemradio", { name: "All items", exact: true })
      .click();
    await expect(page).not.toHaveURL(/status=/);
    await expect(article).toBeVisible();

    // 6. Change filter back to 'Read only'
    await page.getByRole("button", { name: /Filter/ }).click();
    await page
      .getByRole("menuitemradio", { name: "Read only", exact: true })
      .click();
    await expect(page).toHaveURL(/status=read/);

    // The item should NOT be listed in the "Read only" view
    await expect(article).not.toBeVisible();
  });
});
