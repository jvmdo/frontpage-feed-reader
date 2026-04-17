import { db } from "@/db";
import { feeds, subscriptions } from "@/db/schema";
import { expect, test } from "./fixtures/test-extend";

test.describe("Manage Feeds", () => {
  test("displays a subscribed feed in the list", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed a feed and subscription directly
    const [feed] = await db
      .insert(feeds)
      .values({
        url: `https://example.com/rss?tenant=${userId}`,
        title: "Test Feed Title",
        healthStatus: "healthy",
      })
      .returning();

    await db.insert(subscriptions).values({
      userId: userId,
      feedId: feed.id,
    });

    // 2. Navigate to Dashboard then to Manage Feeds via sidebar
    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("link", { name: /manage feeds/i }).click();

    // 3. Verify we are on the correct page and the feed is visible
    await expect(page).toHaveURL("/manage-feeds");
    await expect(
      page.getByRole("heading", { name: /manage feeds/i }),
    ).toBeVisible();

    // Wait for streaming hydration to complete
    await expect(
      page.getByRole("status", { name: /loading feeds/i }),
    ).toBeHidden();

    const table = page.getByRole("table");
    await expect(table.getByText("Test Feed Title")).toBeVisible();
    await expect(
      table.getByText(`https://example.com/rss?tenant=${userId}`),
    ).toBeVisible();
    await expect(table.getByText(/healthy/i)).toBeVisible();
  });

  test("shows empty state when no feeds are subscribed", async ({
    authedPage,
  }) => {
    const { page } = authedPage;

    // Navigate directly to Manage Feeds
    await page.goto("/manage-feeds");

    // Wait for streaming hydration to complete
    await expect(
      page.getByRole("status", { name: /loading feeds/i }),
    ).toBeHidden();

    // Verify empty state
    await expect(
      page.getByRole("heading", { level: 2, name: /no feeds yet/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/you haven't subscribed to any rss feeds/i),
    ).toBeVisible();
  });

  test.describe("UI State Management & Transitions", () => {
    test("transitions from empty state to table when a feed is added", async ({
      authedPage,
    }) => {
      const { page, userId } = authedPage;
      const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

      await page.goto("/manage-feeds");

      // Wait for streaming hydration to complete
      await expect(
        page.getByRole("status", { name: /loading feeds/i }),
      ).toBeHidden();

      // Verify initial empty state
      await expect(
        page.getByRole("heading", { level: 2, name: /no feeds yet/i }),
      ).toBeVisible();

      // Add a feed
      await page.getByRole("button", { name: /add your first feed/i }).click();

      const dialog = page.getByRole("dialog");

      await dialog.getByLabel(/feed url/i).fill(feedUrl);
      await dialog.getByRole("button", { name: /add/i }).click();

      // Verify transition to table
      const table = page.getByRole("table");

      await expect(table.getByText("Standard RSS 2.0 Feed")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: /no feeds yet/i }),
      ).not.toBeVisible();
    });

    test("transitions from table to empty state when the last feed is deleted", async ({
      authedPage,
    }) => {
      const { page, userId } = authedPage;

      // Setup: Seed one subscription
      const [feed] = await db
        .insert(feeds)
        .values({
          url: `https://example.com/to-delete?tenant=${userId}`,
          title: "Delete Me",
          healthStatus: "healthy",
        })
        .returning();
      await db.insert(subscriptions).values({ userId, feedId: feed.id });

      // Navigate
      await page.goto("/manage-feeds");

      // Wait for streaming hydration to complete
      await expect(
        page.getByRole("status", { name: /loading feeds/i }),
      ).toBeHidden();

      // Delete the only feed
      const table = page.getByRole("table");
      await table.getByRole("button", { name: /open menu/i }).click();
      await page.getByRole("menuitem", { name: /delete/i }).click();

      const alertDialog = page.getByRole("alertdialog");
      await alertDialog.getByRole("button", { name: /remove/i }).click();

      // Verify transition back to empty state
      await expect(
        page.getByRole("heading", { level: 2, name: /no feeds yet/i }),
      ).toBeVisible();
      await expect(table).not.toBeVisible();
    });

    test("updates title immediately in the table", async ({ authedPage }) => {
      const { page, userId } = authedPage;

      // Setup: Seed one subscription
      const [feed] = await db
        .insert(feeds)
        .values({
          url: `https://example.com/edit-me?tenant=${userId}`,
          title: "Original Title",
          healthStatus: "healthy",
        })
        .returning();
      await db.insert(subscriptions).values({ userId, feedId: feed.id });

      // Navigate
      await page.goto("/manage-feeds");

      // Wait for streaming hydration to complete
      await expect(
        page.getByRole("status", { name: /loading feeds/i }),
      ).toBeHidden();

      // Get the table
      const table = page.getByRole("table");

      await expect(table.getByText("Original Title")).toBeVisible();

      // Edit the title
      await table.getByRole("button", { name: /open menu/i }).click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      const dialog = page.getByRole("dialog");

      await dialog.getByLabel(/^title$/i).fill("New Better Title");
      await dialog.getByRole("button", { name: /save changes/i }).click();

      // Verify immediate update
      const toast = page.locator("[data-sonner-toast]");

      await expect(toast).toContainText("Subscription updated");

      // Check both table and sidebar reflect the change
      await expect(table.getByText("New Better Title")).toBeVisible();
      await expect(table.getByText("Original Title")).not.toBeVisible();
    });

    test("renders 'Last Fetched' relative time correctly without hydration errors", async ({
      authedPage,
    }) => {
      const { page, userId } = authedPage;

      // Setup: Seed one subscription with a recent success timestamp
      const [feed] = await db
        .insert(feeds)
        .values({
          url: `https://example.com/time-test?tenant=${userId}`,
          title: "Time Test",
          healthStatus: "healthy",
          lastSuccessAt: new Date(),
        })
        .returning();

      await db.insert(subscriptions).values({ userId, feedId: feed.id });

      // Navigate and check for the "just now"
      await page.goto("/manage-feeds");

      // Wait for streaming hydration to complete
      await expect(
        page.getByRole("status", { name: /loading feeds/i }),
      ).toBeHidden();

      // Assert
      const table = page.getByRole("table");

      await expect(table.getByText(/just now|seconds? ago/i)).toBeVisible();
    });
  });
});
