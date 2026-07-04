import { subMinutes } from "date-fns";
import { db } from "@/db";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { expect, test } from "./fixtures/test-extend";

test.describe("Auto-Refresh and Polling", () => {
  test("notifies user and loads new items without page reload", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: A feed with one initial item
    const { feed } = await seedFeedWithSubscription(db, userId, {
      url: `https://example.com/e2e-polling?tenant=${userId}`,
    });

    const tenMinutesAgo = subMinutes(new Date(), 10);
    await seedItems(db, feed.id, [
      {
        guid: `initial-${userId}`,
        title: "Initial Item",
        publishedAt: tenMinutesAgo,
        createdAt: tenMinutesAgo, // Explicitly old arrival
      },
    ]);

    // Clock manipulation for fast-forwarding polling
    await page.clock.install();

    // 1. Navigate and wait for hydration
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Simulate background update (direct DB insertion)
    await seedItems(db, feed.id, [
      {
        guid: `new-item-${userId}`,
        title: "Fresh Content",
        publishedAt: new Date(),
        createdAt: new Date(), // Explicitly set to current JS time (millisecond precision)
      },
    ]);

    // Fast-forward 61 seconds to trigger the background refetch
    await page.clock.fastForward(61000);

    // 3. The banner should appear in the sticky toolbar
    const banner = page.getByRole("button", { name: /1 new item available/i });
    await expect(banner).toBeVisible();

    // 4. Action: Click the banner to load items
    await banner.click();

    // 5. Verification: The new item is prepended and the banner is gone
    await expect(page.getByText("Fresh Content")).toBeVisible();
    await expect(banner).not.toBeVisible();
  });

  test("opening an article in reader mode does not auto-refresh the list or dismiss the banner", async ({
    authedPage,
  }) => {
    const { page, userId } = authedPage;

    // Setup: A feed with one initial item
    const { feed } = await seedFeedWithSubscription(db, userId, {
      url: `https://example.com/e2e-polling-reader?tenant=${userId}`,
    });

    const tenMinutesAgo = subMinutes(new Date(), 10);
    await seedItems(db, feed.id, [
      {
        guid: `initial-reader-${userId}`,
        title: "Initial Item To Read",
        publishedAt: tenMinutesAgo,
        createdAt: tenMinutesAgo,
      },
    ]);

    await page.clock.install();

    // 1. Navigate and wait for hydration
    await page.goto("/dashboard");
    await page.waitForSelector('body[data-hydrated="true"]');

    // 2. Simulate background update
    await seedItems(db, feed.id, [
      {
        guid: `new-item-reader-${userId}`,
        title: "Fresh Content",
        publishedAt: new Date(),
        createdAt: new Date(),
      },
    ]);

    // 3. Fast-forward past the 60s polling interval and the 5-minute staleTime
    // (5 minutes + 61 seconds = 361000ms) to ensure the query is fully stale
    await page.clock.fastForward(361000);

    // 4. The banner should appear
    const banner = page.getByRole("button", { name: /1 new item available/i });
    await expect(banner).toBeVisible();

    // 5. User opens the existing item to read it (mounts the Lightbox and useItemReaderNavigation)
    await page
      .getByRole("button", { name: `Open reader for Initial Item To Read` })
      .click();

    // 6. Verify the reader is open
    const readerTitle = page.getByRole("heading", {
      name: "Initial Item To Read",
    });
    await expect(readerTitle).toBeVisible();

    // 7. CRITICAL VERIFICATION: The banner must still be visible in the background,
    // meaning the list did not auto-update when the lightbox mounted.
    await expect(banner).toBeVisible();

    // 8. Close the reader
    await page.getByRole("button", { name: /close/i }).click();

    // 9. Click the banner to finally load the items manually
    await banner.click();
    await expect(page.getByText("Fresh Content")).toBeVisible();
    await expect(banner).not.toBeVisible();
  });
});
