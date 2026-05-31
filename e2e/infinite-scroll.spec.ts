import { db } from "@/db";
import { PAGINATION_LIMIT } from "@/lib/constants";
import {
  seedCategory,
  seedFeedWithSubscription,
  seedItems,
} from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Infinite Scroll", () => {
  for (const layout of ["list", "grid"]) {
    test(`loads more items when scrolling down in ${layout} layout`, async ({
      authedPage,
    }) => {
      const { page, userId } = authedPage;

      const { feed } = await seedFeedWithSubscription(db, userId, {
        url: `https://example.com/scrolling-feed-${layout}?tenant=${userId}`,
        title: `Scrolling Feed ${layout}`,
      });

      const totalItems = PAGINATION_LIMIT * 2 + 5;
      const now = Date.now();
      const items = Array.from({ length: totalItems }).map((_, i) => ({
        guid: `item-${i}-${userId}-${layout}`,
        title: `Infinite Scroll Item ${i} ${layout}`,
        description: `Description for article ${i}`,
        publishedAt: new Date(now - i * 60000),
      }));

      await seedItems(db, feed.id, items);

      // 1. Go to dashboard with specific layout
      await page.goto(`/dashboard?layout=${layout}`);
      await page.waitForSelector('body[data-hydrated="true"]');

      // 2. Verify first page items are present
      const firstItem = page.getByRole("heading", {
        name: `Infinite Scroll Item 0 ${layout}`,
      });
      await expect(firstItem).toBeVisible();

      // 3. Scroll to trigger more loading
      // We scroll in pulses and wait for Virtuoso to render
      const lastItemTitle = `Infinite Scroll Item ${totalItems - 1} ${layout}`;
      const lastItem = page.getByRole("heading", { name: lastItemTitle });

      // Maximum 20 scroll attempts
      for (let i = 0; i < 20; i++) {
        const isVisible = await lastItem.isVisible();
        if (isVisible) break;

        await page.evaluate(() => {
          const container = document.getElementById("feed-container");
          if (container) {
            container.scrollBy(0, 1500);
          }
        });
        await page.waitForTimeout(400);
      }

      // 4. Verify that the last item eventually appeared
      await expect(lastItem).toBeVisible();

      // 5. Scroll back to top and verify the first item is still accessible
      // (Testing that virtualization handles reverse scrolling too)
      const firstItemLocator = page.getByRole("heading", {
        name: `Infinite Scroll Item 0 ${layout}`,
      });

      for (let i = 0; i < 20; i++) {
        const isVisible = await firstItemLocator.isVisible();
        if (isVisible) break;

        await page.evaluate(() => {
          const container = document.getElementById("feed-container");
          if (container) {
            container.scrollBy(0, -1500);
          }
        });
        await page.waitForTimeout(400);
      }

      await expect(firstItemLocator).toBeVisible();
    });
  }

  test("maintains infinite scroll after navigation (Reset Bug Fix)", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Seed a category and two feeds
    const category = await seedCategory(db, {
      userId,
      name: "Debug Category",
    });

    const { feed: feed1 } = await seedFeedWithSubscription(db, userId, {
      url: `https://example.com/feed-1?tenant=${userId}`,
      title: "Feed 1",
    });

    const { feed: feed2 } = await seedFeedWithSubscription(db, userId, {
      url: `https://example.com/feed-2?tenant=${userId}`,
      title: "Feed 2",
    });

    // Assign feed 2 to category
    await db
      .update(require("@/db/schema").subscriptions)
      .set({ categoryId: category.id })
      .where(
        require("drizzle-orm").eq(
          require("@/db/schema").subscriptions.feedId,
          feed2.id,
        ),
      );

    // Seed items for both
    const items1 = Array.from({ length: PAGINATION_LIMIT + 5 }).map((_, i) => ({
      guid: `f1-item-${i}-${userId}`,
      title: `F1 Item ${i}`,
      publishedAt: new Date(Date.now() - i * 1000),
    }));

    const items2 = Array.from({ length: PAGINATION_LIMIT + 5 }).map((_, i) => ({
      guid: `f2-item-${i}-${userId}`,
      title: `F2 Item ${i}`,
      publishedAt: new Date(Date.now() - i * 1000),
    }));

    await seedItems(db, feed1.id, items1);
    await seedItems(db, feed2.id, items2);

    // 1. Go to "All Items" in Grid layout
    await page.goto("/dashboard?layout=grid");
    await page.waitForSelector('body[data-hydrated="true"]');
    await expect(
      page.getByRole("heading", { name: "F1 Item 0" }),
    ).toBeVisible();

    // 2. Navigate to specific category via sidebar
    await page
      .locator('[data-slot="sidebar"]')
      .getByText("Debug Category")
      .click();
    await expect(
      page.getByRole("heading", { name: "F2 Item 0" }),
    ).toBeVisible();

    // 3. Scroll to bottom
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const container = document.getElementById("feed-container");
        if (container) container.scrollBy(0, container.scrollHeight);
      });
      await page.waitForTimeout(300);
    }

    // 4. Verify that page 2 of the category loads
    const page2Item = page.getByRole("heading", {
      name: `F2 Item ${PAGINATION_LIMIT + 1}`,
    });
    await expect(page2Item).toBeVisible();
  });
});
