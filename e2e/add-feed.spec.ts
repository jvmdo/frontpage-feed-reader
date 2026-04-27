import { expect, test } from "./fixtures/test-extend";

const FEED_TYPES = [
  { file: "rss-2.xml", title: "Standard RSS 2.0 Feed" },
  { file: "atom-1.xml", title: "Standard Atom 1.0 Feed" },
  { file: "rss-namespaces.xml", title: "Namespace Extended Feed" },
];

const BAD_FEED_TYPES = [
  { file: "bad-rss-2.xml", title: "BAD RSS 2.0 Feed" },
  { file: "bad-atom-1.xml", title: "BAD Atom 1.0 Feed" },
  { file: "bad-rss-namespaces.xml", title: "BAD Namespace Extended Feed" },
];

for (const { file } of FEED_TYPES) {
  test(`successfully adds and parses ${file}`, async ({ authedPage }) => {
    const { page, userId } = authedPage;
    const feedUrl = `http://localhost:3432/${file}?tenant=${userId}`;

    // 1. Navigate to dashboard and wait for hydration
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Open Add Feed modal and fill in form for new feed
    await page
      .getByRole("banner")
      .getByRole("button", { name: /add feed/i })
      .click();

    const dialog = page.getByRole("dialog", { name: /add feed/i });

    await dialog.getByLabel(/feed url/i).fill(feedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // 3. Assert toast shows up
    const toast = page.locator("[data-sonner-toast]");

    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Feed added successfully");

    await expect(dialog).not.toBeVisible();
  });
}

test("handles non-existent feed with friendly error", async ({
  authedPage,
}) => {
  const { page, userId } = authedPage;
  const feed404Url = `http://localhost:3432/non-existent.xml?tenant=${userId}`;

  // 1. Navigate to dashboard and wait for hydration
  await page.goto("/dashboard");
  await page.waitForSelector('body[data-hydrated="true"]');

  // 2. Open Add Feed dialog and fill in form for 404 feed
  await page
    .getByRole("banner")
    .getByRole("button", { name: /add feed/i })
    .click();

  const dialog = page.getByRole("dialog", { name: /add feed/i });

  await dialog.getByLabel(/feed url/i).fill(feed404Url);
  await dialog.getByRole("button", { name: /add/i }).click();

  // 3. Verify error Toast appears
  const toast = page.locator("[data-sonner-toast]");

  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/We couldn't reach this URL/i);

  // Dialog should stay open
  await expect(dialog).toBeVisible();
});

for (const { file } of BAD_FEED_TYPES) {
  test(`handles invalid feed format with friendly error: ${file}`, async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;
    const badFeedUrl = `http://localhost:3432/${file}?tenant=${userId}`;

    // 1. Navigate to dashboard and wait for hydration
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Open Add Feed dialog and fill in form for broken feed
    await page
      .getByRole("banner")
      .getByRole("button", { name: /add feed/i })
      .click();

    const dialog = page.getByRole("dialog", { name: /add feed/i });

    await dialog.getByLabel(/feed url/i).fill(badFeedUrl);
    await dialog.getByRole("button", { name: /add/i }).click();

    // Assert toast shows up with validation error
    const toast = page.locator("[data-sonner-toast]");

    await expect(toast).toBeVisible();
    await expect(toast).toContainText(
      /This link doesn't seem to be a valid RSS or Atom feed/i,
    );

    // Dialog should stay open for correction
    await expect(dialog).toBeVisible();
  });
}
