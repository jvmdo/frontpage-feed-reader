import { db } from "@/db";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test("displays a subscribed feed in the list", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed and subscription directly
  await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/rss?tenant=${userId}`,
    title: "Test Feed Title",
    healthStatus: "healthy",
  });

  // 1. Navigate to Manage Feeds page
  await page.goto("/manage-feeds");

  // 2. Assert feed is listed
  const table = page.getByRole("table");

  await expect(table.getByText(/test feed title/i)).toBeVisible();
  await expect(table.getByText(/healthy/i)).toBeVisible();
  await expect(
    table.getByText(`https://example.com/rss?tenant=${userId}`),
  ).toBeVisible();
});

test("shows empty state when no feeds are subscribed", async ({
  authedPage,
}) => {
  const { page } = authedPage;

  // 1. Navigate directly to Manage Feeds
  await page.goto("/manage-feeds");

  // 2. Verify empty state
  await expect(
    page.getByRole("main").getByText("You haven't subscribed to any"),
  ).toBeVisible();
});

test("transitions from empty state to table when a feed is added", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;
  const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

  // 1. Navigate
  await page.goto("/manage-feeds");

  const main = page.getByRole("main");

  // 2. Verify initial empty state (also signals that hydration finished)
  await expect(main.getByText(/no feeds yet/i)).toBeVisible();

  // 3. Add a feed
  await main.getByRole("button", { name: /add your first feed/i }).click();

  const dialog = page.getByRole("dialog", { name: /add feed/i });

  await dialog.getByLabel(/feed url/i).fill(feedUrl);
  await dialog.getByRole("button", { name: /add/i, exact: true }).click();

  // 4. Verify transition to table
  const table = page.getByRole("table");

  await expect(table.getByText("Standard RSS 2.0 Feed")).toBeVisible();
  await expect(main.getByText(/no feeds yet/i)).not.toBeVisible();
});

test("transitions from table to empty state when the last feed is deleted", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed one subscription
  await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/to-delete?tenant=${userId}`,
    title: "Delete Me",
    healthStatus: "healthy",
  });

  // 1. Navigate
  await page.goto("/manage-feeds");

  // 2. Verify seed feed is available (also guarantees hydration finished)
  const table = page.getByRole("table");

  await expect(table.getByText(/delete me/i)).toBeVisible();

  // 3. Delete the only feed
  await table.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("menuitem", { name: /delete/i }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /remove/i })
    .click();

  // 4. Verify transition back to empty state
  const main = page.getByRole("main");

  await expect(main.getByText(/no feeds yet/i)).toBeVisible();
  await expect(table).not.toBeVisible();
});

test("updates title immediately in the table", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: Seed one subscription
  await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/edit-me?tenant=${userId}`,
    title: "Original Title",
    healthStatus: "healthy",
  });

  // 1. Navigate
  await page.goto("/manage-feeds");

  // 2. Assert table's initial state
  const table = page.getByRole("table");

  await expect(table.getByText(/original title/i)).toBeVisible();

  // 3. Edit the title
  await table.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("menuitem", { name: /edit/i }).click();

  const dialog = page.getByRole("dialog", { name: /edit subscription/i });

  await dialog.getByLabel(/title/i).fill("New Better Title");
  await dialog.getByRole("button", { name: /save changes/i }).click();

  // 4. Verify immediate update
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /subscription updated/i,
  );

  // Check both table and sidebar reflect the change
  await expect(table.getByText(/new better title/i)).toBeVisible();
  await expect(table.getByText(/original title/i)).not.toBeVisible();
  await expect(
    page
      .locator('[data-slot="sidebar"]')
      .getByRole("link", { name: /new better title/i }),
  ).toBeVisible();
});

test("assigns a feed to a category", async ({ authedPage }) => {
  const { page, userId } = authedPage;

  // Setup: One category and one unassigned feed
  await seedCategory(db, { userId, name: "Tech News" });
  await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/assign-me?tenant=${userId}`,
    title: "Unassigned Feed",
  });

  // 1. Navigate to Manage Feeds
  await page.goto("/manage-feeds");

  const table = page.getByRole("table");
  const row = table.getByRole("row", { name: /unassigned feed/i });

  // 2. Open Edit dialog
  await row.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("menuitem", { name: /edit/i }).click();

  const dialog = page.getByRole("dialog", { name: /edit subscription/i });

  // 3. Select category
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: /tech news/i }).click();
  await dialog.getByRole("button", { name: /save changes/i }).click();

  // 4. Verify update
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /subscription updated/i,
  );

  // 5. Verify in sidebar (category folder should contain the feed)
  const sidebar = page.locator('[data-slot="sidebar"]');
  const categoryLink = sidebar.getByRole("link", { name: /tech news/i });

  await categoryLink.click(); // First click filters, but collapses the menu
  await categoryLink.click(); // Second click to open it

  await expect(page).toHaveURL(/categoryId=/);
  await expect(
    sidebar.getByRole("link", { name: /unassigned feed/i }),
  ).toBeVisible();
});

test("renders 'Last Fetched' relative time correctly", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed one subscription with a recent success timestamp
  await seedFeedWithSubscription(db, userId, {
    url: `https://example.com/time-test?tenant=${userId}`,
    title: "Time Test",
    healthStatus: "healthy",
    lastSuccessAt: new Date(),
  });

  // 1. Navigate and check for the "just now"
  await page.goto("/manage-feeds");

  // 2. Wait for streaming hydration to complete
  const table = page.getByRole("table");

  // 3. Assert
  await expect(table.getByText(/just now|seconds? ago/i)).toBeVisible();
});

test("clicking 'Refresh' in the table triggers ingestion and updates UI", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;

  // Setup: Seed a feed that points to a local fixture
  const feedUrl = `http://localhost:3432/rss-2.xml?tenant=${userId}`;

  await seedFeedWithSubscription(db, userId, {
    url: feedUrl,
    title: "Original Title",
    healthStatus: "unknown",
  });

  // 1. Navigate to Manage Feeds
  await page.goto("/manage-feeds");

  // 2. Verify initial state
  const table = page.getByRole("table");
  await expect(table.getByText("Original Title")).toBeVisible();
  await expect(table.getByText("Never")).toBeVisible();

  // 3. Trigger Refresh
  await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("menuitem", { name: /refresh/i }).click();

  // 4. Verify operation succeeded
  await expect(page.locator("[data-sonner-toast]")).toContainText(
    /feed refreshed/i,
  );
  await expect(table.getByText(/just now/i)).toBeVisible();
  await expect(table.getByText("Standard RSS 2.0 Feed")).toBeVisible();
});
