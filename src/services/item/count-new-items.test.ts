import { subMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { userPreferences } from "@/db/schema";
import { seedFeedWithSubscription, seedItems } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { countNewItems } from "./count-new-items";

describe("countNewItems", () => {
  test("counts items published after the 'since' date for a user's subscription", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();
    const tenMinsAgo = subMinutes(now, 10);

    // 1. Seed items
    await seedItems(tx, feed.id, [
      { publishedAt: subMinutes(now, 15), guid: "old-1" }, // Older than since
      { publishedAt: subMinutes(now, 5), guid: "new-1" }, // Newer than since
      { publishedAt: subMinutes(now, 2), guid: "new-2" }, // Newer than since
    ]);

    // 2. Act
    const count = await countNewItems(tx, testUser.id, {
      since: tenMinsAgo,
      feedId: feed.id,
    });

    // 3. Assert
    expect(count).toBe(2);
  });

  test("returns 0 if no new items exist since the date", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();

    await seedItems(tx, feed.id, [
      { publishedAt: subMinutes(now, 20), guid: "old-1" },
    ]);

    const count = await countNewItems(tx, testUser.id, {
      since: subMinutes(now, 5),
    });

    expect(count).toBe(0);
  });

  test("respects user's `markedAllReadAt` watermark", async ({
    tx,
    testUser,
  }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();
    const watermark = subMinutes(now, 2); // Marked all read 2 mins ago

    await tx.insert(userPreferences).values({
      userId: testUser.id,
      markedAllReadAt: watermark,
    });

    await seedItems(tx, feed.id, [
      {
        publishedAt: subMinutes(now, 5),
        createdAt: subMinutes(now, 5),
        guid: "behind-watermark",
      },
      {
        publishedAt: subMinutes(now, 1),
        createdAt: subMinutes(now, 1),
        guid: "ahead-watermark",
      },
    ]);

    // Checking since 10 mins ago
    const count = await countNewItems(tx, testUser.id, {
      since: subMinutes(now, 10),
    });

    // Only the one ahead of the watermark should count
    expect(count).toBe(1);
  });

  test("filters by feedId correctly", async ({ tx, testUser }) => {
    const { feed: f1 } = await seedFeedWithSubscription(tx, testUser.id);
    const { feed: f2 } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();

    await seedItems(tx, f1.id, [{ publishedAt: now, guid: "f1-item" }]);
    await seedItems(tx, f2.id, [{ publishedAt: now, guid: "f2-item" }]);

    const count = await countNewItems(tx, testUser.id, {
      since: subMinutes(now, 1),
      feedId: f1.id,
    });

    expect(count).toBe(1);
  });

  test("filters by categoryId correctly", async ({ tx, testUser }) => {
    const { feed: f1, subscription: s1 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
    );
    const { feed: f2 } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();

    // 1. Create a category and assign f1 to it
    const [category] = await tx
      .insert(schema.categories)
      .values({
        userId: testUser.id,
        name: "Tech",
      })
      .returning();

    await tx
      .update(schema.subscriptions)
      .set({ categoryId: category.id })
      .where(eq(schema.subscriptions.id, s1.id));

    await seedItems(tx, f1.id, [{ publishedAt: now, guid: "f1-item" }]);
    await seedItems(tx, f2.id, [{ publishedAt: now, guid: "f2-item" }]);

    const count = await countNewItems(tx, testUser.id, {
      since: subMinutes(now, 1),
      categoryId: category.id,
    });

    expect(count).toBe(1);
  });

  test("filters by multiple feedIds correctly", async ({ tx, testUser }) => {
    const { feed: f1 } = await seedFeedWithSubscription(tx, testUser.id);
    const { feed: f2 } = await seedFeedWithSubscription(tx, testUser.id);
    const { feed: f3 } = await seedFeedWithSubscription(tx, testUser.id);
    const now = new Date();

    await seedItems(tx, f1.id, [{ publishedAt: now, guid: "f1-item" }]);
    await seedItems(tx, f2.id, [{ publishedAt: now, guid: "f2-item" }]);
    await seedItems(tx, f3.id, [{ publishedAt: now, guid: "f3-item" }]);

    const count = await countNewItems(tx, testUser.id, {
      since: subMinutes(now, 1),
      feedIds: [f1.id, f2.id],
    });

    expect(count).toBe(2);
  });
});
