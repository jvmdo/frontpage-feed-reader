import { expect, test } from "@playwright/test";

test.describe("Onboarding Tour", () => {
  test("full onboarding journey as a guest", async ({ page }) => {
    // 1. Start at landing page
    await page.goto("/");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Access as Guest
    await page
      .getByRole("button", { name: /try as guest/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Welcome Dialog appears
    const welcomeDialog = page.getByRole("alertdialog");
    await expect(welcomeDialog).toBeVisible();
    await expect(welcomeDialog).toContainText(/welcome to frontpage/i);

    // 4. Start the tour
    await welcomeDialog.getByRole("button", { name: /take the tour/i }).click();
    // await expect(welcomeDialog).not.toBeVisible();

    // 5. Step 1: Add your first feed
    const tourContent = page.locator(
      '[data-part="content"][data-scope="tour"]',
    );
    await expect(tourContent).toBeVisible();
    await expect(tourContent).toContainText(/add your first feed/i);

    // Click the actual button that is spotlighted
    await page.locator('[data-tour="add-feed"]').click();

    // 6. Step 2: Subscribe to a feed (Wait for Form)
    await expect(tourContent).toContainText(/subscribe to a feed/i);
    const addFeedDialog = page.getByRole("dialog", { name: /add feed/i });
    await expect(addFeedDialog).toBeVisible();

    // The feed URL should be prefilled by the tour
    const urlInput = addFeedDialog.getByLabel(/feed url/i);
    await expect(urlInput).not.toHaveValue("");

    // Submit the form
    await page.locator('[data-tour="add-feed-submit"]').click();

    // 7. Step 3: View your feeds (Wait for Sidebar item)
    // The tour automatically transitions once the feed appears
    await expect(tourContent).toContainText(/view your feeds/i);
    const welcomeFeed = page.locator('[data-tour="welcome-feed"]');
    await expect(welcomeFeed).toBeVisible();

    // Click the feed in sidebar
    await welcomeFeed.click();

    // 8. Step 4: Read an article (Wait for Item Card)
    await expect(tourContent).toContainText(/read an article/i);
    const welcomeItem = page.locator('[data-tour="welcome-item"]');
    await expect(welcomeItem).toBeVisible();

    // Click the item to open reader
    await welcomeItem.click();

    // 9. Step 5: Immersive Reading (Floating Step)
    await expect(tourContent).toContainText(/immersive reading/i);
    const reader = page.getByRole("dialog", { name: /item reader/i });
    await expect(reader).toBeVisible();

    // Click 'Next' to finish
    await tourContent.getByRole("button", { name: /next/i }).click();

    // 10. Step 6: Completion Dialog
    await expect(tourContent).toContainText(/you're all set/i);
    await tourContent
      .getByRole("button", { name: /close tour/i })
      .filter({ hasText: /finish/i })
      .click();

    // 11. Verification: Tour is closed and reader is auto-closed
    await expect(tourContent).not.toBeVisible();
    await expect(reader).not.toBeVisible();
  });
});
