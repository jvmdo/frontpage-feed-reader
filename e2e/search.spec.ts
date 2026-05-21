import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Global Search", () => {
  test("searching for an article and navigating to it", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed some searchable content
    const { feed } = await seedFeedWithSubscription(db, userId, {
      title: "Tech News",
    });

    await seedItems(db, feed.id, [
      {
        title: "Mastering React Context",
        textContent:
          "React context is a powerful pattern for state management.",
      },
      {
        title: "Exploring Postgres GIN Indexes",
        textContent: "Full-text search in Postgres is fast and reliable.",
      },
    ]);

    // 2. Navigate to dashboard and wait for hydration
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 3. Open Search Palette using keyboard shortcut
    await page.keyboard.press("/");

    const searchDialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(searchDialog).toBeVisible();

    const input = searchDialog.getByPlaceholder(/search your articles/i);
    await expect(input).toBeFocused();

    // 4. Type a search term
    await input.fill("React");

    // 5. Verify results appear (autocomplete)
    const resultItem = searchDialog.getByRole("option", {
      name: /mastering react context/i,
    });
    await expect(resultItem).toBeVisible();
    await expect(resultItem).toContainText(
      "React context is a powerful pattern",
    );

    // 6. Navigate to the result
    await resultItem.click();

    // 7. Verify navigation and Reader View
    await expect(page).toHaveURL(/.*dashboard.*itemId=\d+/);

    // The search palette should be closed
    await expect(searchDialog).not.toBeVisible();

    // The reader view (lightbox dialog) should show the article title
    const readerDialog = page.getByRole("dialog", { name: /item reader/i });
    await expect(readerDialog).toBeVisible();
    await expect(readerDialog.getByRole("heading", { level: 1 })).toContainText(
      "Mastering React Context",
    );
  });

  test("loading more results", async ({ authedPage }) => {
    const { page, userId } = authedPage;

    // 1. Setup: Seed 11 items (1 page + 1 item)
    const { feed } = await seedFeedWithSubscription(db, userId, {
      title: "Pagination Feed",
    });

    const manyItems = Array.from({ length: 11 }, (_, i) => ({
      title: `Article ${i + 1}`,
      textContent: `Content for article ${i + 1}`,
    }));

    await seedItems(db, feed.id, manyItems);

    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    await page.keyboard.press("/");
    const searchDialog = page.getByRole("dialog", { name: /command palette/i });
    const input = searchDialog.getByPlaceholder(/search your articles/i);

    // 2. Search for the articles
    await input.fill("Article");

    // 3. Verify first page results + Load More button are visible (10 + 1 = 11 options)
    await expect(searchDialog.getByRole("option")).toHaveCount(11);

    // 4. Click "Load more"
    const loadMoreButton = searchDialog.getByRole("option", {
      name: /load more results/i,
    });
    await expect(loadMoreButton).toBeVisible();
    await loadMoreButton.click();

    // 5. Verify more results are loaded (total 11 articles, no load more button)
    await expect(searchDialog.getByRole("option")).toHaveCount(11);
    await expect(loadMoreButton).not.toBeVisible();
  });
});
