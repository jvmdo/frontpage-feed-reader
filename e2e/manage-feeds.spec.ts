import { db } from "@/db";
import { seedFeedWithSubscription } from "@/tests/seeding";
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
    page.getByText(/you haven't subscribed to any rss feeds/i),
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
