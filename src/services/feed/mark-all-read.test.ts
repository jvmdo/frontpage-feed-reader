import { eq } from "drizzle-orm";
import { categories, subscriptions, userPreferences } from "@/db/schema";
import {
  CategoryNotFoundError,
  MarkAllReadIdRequiredError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { markAllRead } from "./mark-all-read";

describe("markAllRead", () => {
  test("updates global watermark", async ({ tx, testUser }) => {
    await markAllRead(tx, testUser.id, { scope: "global" });

    const [prefs] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, testUser.id));

    expect(prefs.markedAllReadAt).toBeInstanceOf(Date);
  });

  test("updates category watermark", async ({ tx, testUser }) => {
    const cat = await seedCategory(tx, { userId: testUser.id, name: "Tech" });

    await markAllRead(tx, testUser.id, { scope: "category", id: cat.id });

    const [updated] = await tx
      .select()
      .from(categories)
      .where(eq(categories.id, cat.id));

    expect(updated.markedAllReadAt).toBeInstanceOf(Date);
  });

  test("throws CategoryNotFoundError when category not found or not owned", async ({
    tx,
    testUser,
  }) => {
    await expect(
      markAllRead(tx, testUser.id, { scope: "category", id: 999999 }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  test("updates feed watermark (via feedId)", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);

    await markAllRead(tx, testUser.id, { scope: "feed", id: feed.id });

    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.feedId, feed.id));

    expect(sub.markedAllReadAt).toBeInstanceOf(Date);
  });

  test("throws SubscriptionNotFoundError when subscription not found or not owned", async ({
    tx,
    testUser,
  }) => {
    await expect(
      markAllRead(tx, testUser.id, { scope: "feed", id: 999999 }),
    ).rejects.toThrow(SubscriptionNotFoundError);
  });

  test("throws MarkAllReadIdRequiredError when ID is missing for category or feed scope", async ({
    tx,
    testUser,
  }) => {
    await expect(
      markAllRead(tx, testUser.id, { scope: "category" } as any),
    ).rejects.toThrow(MarkAllReadIdRequiredError);

    await expect(
      markAllRead(tx, testUser.id, { scope: "feed" } as any),
    ).rejects.toThrow(MarkAllReadIdRequiredError);
  });
});
