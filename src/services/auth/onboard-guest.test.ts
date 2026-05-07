import { eq } from "drizzle-orm";
import { HttpResponse, http } from "msw";
import { categories, subscriptions, userPreferences } from "@/db/schema";
import { server } from "@/tests/mocks/server";
import { test } from "@/tests/test-extend";
import sampleFeeds from "../../../data/sample-feeds.json";
import { onboardGuest } from "./onboard-guest";

describe("onboardGuest", () => {
  beforeEach(() => {
    // Mock all feed URLs from sample-feeds.json
    for (const category of sampleFeeds.categories) {
      for (const feed of category.feeds) {
        server.use(
          http.get(feed.feedUrl, () => {
            return HttpResponse.xml(`
              <rss version="2.0">
                <channel>
                  <title>${feed.title}</title>
                  <link>${feed.siteUrl}</link>
                  <description>${feed.description}</description>
                  <item>
                    <title>Test Item</title>
                    <link>${feed.siteUrl}test</link>
                    <guid>test-guid-${feed.title}</guid>
                  </item>
                </channel>
              </rss>
            `);
          })
        );
      }
    }
  });

  test("successfully onboards a guest user with curated feeds and preferences", async ({
    tx,
    testUser,
  }) => {
    // 1. Act
    await onboardGuest(tx, testUser.id);

    // 2. Assert: Categories
    const dbCategories = await tx
      .select()
      .from(categories)
      .where(eq(categories.userId, testUser.id));
    expect(dbCategories).toHaveLength(sampleFeeds.categories.length);

    // 3. Assert: Subscriptions
    const dbSubscriptions = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUser.id));
    
    const totalExpectedFeeds = sampleFeeds.categories.reduce(
      (acc, cat) => acc + cat.feeds.length,
      0
    );
    expect(dbSubscriptions).toHaveLength(totalExpectedFeeds);

    // 4. Assert: User Preferences
    const dbPrefs = await tx.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, testUser.id),
    });
    expect(dbPrefs).toBeDefined();
    expect(dbPrefs?.markedAllReadAt).toBeDefined();
    
    // Verify watermark is roughly 7 days ago
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const watermark = dbPrefs!.markedAllReadAt!.getTime();
    expect(Math.abs(watermark - sevenDaysAgo)).toBeLessThan(10000); // 10 second tolerance
  });

  test("is idempotent and doesn't create duplicate records", async ({
    tx,
    testUser,
  }) => {
    // 1. Act: Call twice
    await onboardGuest(tx, testUser.id);
    await onboardGuest(tx, testUser.id);

    // 2. Assert
    const dbCategories = await tx
      .select()
      .from(categories)
      .where(eq(categories.userId, testUser.id));
    expect(dbCategories).toHaveLength(sampleFeeds.categories.length);

    const dbSubscriptions = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, testUser.id));
    
    const totalExpectedFeeds = sampleFeeds.categories.reduce(
      (acc, cat) => acc + cat.feeds.length,
      0
    );
    expect(dbSubscriptions).toHaveLength(totalExpectedFeeds);
  });
});
