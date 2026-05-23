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

    await seedItems(db, feed.id, [
      {
        guid: `initial-${userId}`,
        title: "Initial Item",
        publishedAt: subMinutes(new Date(), 10),
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
});
