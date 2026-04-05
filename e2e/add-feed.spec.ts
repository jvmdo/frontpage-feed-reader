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

test.describe("Add Feed Flow", () => {
  for (const { file } of FEED_TYPES) {
    test(`successfully adds and parses ${file}`, async ({ authedPage }) => {
      const { page, userId } = authedPage;
      const feedUrl = `http://localhost:3432/${file}?tenant=${userId}`;

      await page.goto("/dashboard");

      const sidebar = page.locator('[data-slot="sidebar"]');
      await sidebar.getByRole("button", { name: /add feed/i }).click();

      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(/feed url/i).fill(feedUrl);
      await dialog.getByRole("button", { name: /add/i }).click();

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

    await page.goto("/dashboard");

    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /add feed/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/feed url/i).fill(feed404Url);
    await dialog.getByRole("button", { name: /add/i }).click();

    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(
      "We couldn't reach this URL. Please double-check for typos.",
    );
    await expect(dialog).toBeVisible();
  });

  for (const { file } of BAD_FEED_TYPES) {
    test(`handles invalid feed format with friendly error: ${file}`, async ({
      authedPage,
    }) => {
      const { page, userId } = authedPage;
      const badFeedUrl = `http://localhost:3432/${file}?tenant=${userId}`;

      await page.goto("/dashboard");

      const sidebar = page.locator('[data-slot="sidebar"]');
      await sidebar.getByRole("button", { name: /add feed/i }).click();

      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(/feed url/i).fill(badFeedUrl);
      await dialog.getByRole("button", { name: /add/i }).click();

      const toast = page.locator("[data-sonner-toast]");
      await expect(toast).toBeVisible();
      await expect(toast).toContainText(
        /This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link./i,
      );

      await expect(dialog).toBeVisible();
    });
  }
});
