import { db } from "@/db";
import { seedCategory, seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Bookmarks / Save for Later", () => {
  test("full flow: bookmarking, viewing, filtering, and removing", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed categories and feeds with items
    const cat1 = await seedCategory(db, { userId, name: "Tech", color: "#ff0000" });
    const cat2 = await seedCategory(db, { userId, name: "News", color: "#00ff00" });

    const { feed: f1 } = await seedFeedWithSubscription(db, userId, { title: "Hacker News" }, { categoryId: cat1.id });
    const { feed: f2 } = await seedFeedWithSubscription(db, userId, { title: "Verge" }, { categoryId: cat2.id });

    const [item1] = await seedItems(db, f1.id, [{ title: "Saved Tech Item", publishedAt: new Date() }]);
    const [item2] = await seedItems(db, f2.id, [{ title: "Saved News Item", publishedAt: new Date() }]);

    // 2. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Bookmark items from the list
    const card1 = page.locator("article").filter({ hasText: "Saved Tech Item" });
    const card2 = page.locator("article").filter({ hasText: "Saved News Item" });

    await card1.getByRole("button", { name: /save for later/i }).click();
    await card2.getByRole("button", { name: /save for later/i }).click();

    // Verify visual feedback (filled icon/aria-label change)
    await expect(card1.getByRole("button", { name: /remove from saved/i })).toBeVisible();

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
    await page.getByRole("button", { name: /remove category: news filter/i }).click();
    
    // Back to all saved items
    await expect(page.getByText("Saved Tech Item")).toBeVisible();
    await expect(page.getByText("Saved News Item")).toBeVisible();

    // 9. Remove bookmark
    await card1.getByRole("button", { name: /remove from saved/i }).click();
    await expect(page.getByText("Saved Tech Item")).not.toBeVisible();
    
    // Sidebar unread count for saved should update (optimistically then actually)
    // (This assumes items were seeded as unread)
    const savedBadge = sidebar.locator('li').filter({ hasText: "Saved" }).locator('[data-slot="sidebar-menu-badge"]');
    await expect(savedBadge).toHaveText("1");
  });
});
