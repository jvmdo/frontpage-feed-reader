/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { seedCategory, seedFeedWithSubscription } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { refreshFeeds } from "./refresh-feeds";

vi.mock("@/services/ingestion/feed-ingestion");

describe("refreshFeeds", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("refreshes a specific feed", async ({ tx, testUser }) => {
    const { feed } = await seedFeedWithSubscription(tx, testUser.id);
    vi.mocked(ingestItems).mockResolvedValue({ success: true } as any);

    const result = await refreshFeeds(tx, testUser.id, {
      scope: "feed",
      id: feed.id,
    });

    expect(result).not.toBeNull();
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), feed.id);
  });

  test("refreshes global scope", async ({ tx, testUser }) => {
    const { feed: f1 } = await seedFeedWithSubscription(tx, testUser.id);
    const { feed: f2 } = await seedFeedWithSubscription(tx, testUser.id);
    vi.mocked(ingestItems).mockResolvedValue({ success: true } as any);

    const result = await refreshFeeds(tx, testUser.id, { scope: "global" });

    expect(result).toBeUndefined();
    expect(ingestItems).toHaveBeenCalledTimes(2);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), f1.id);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), f2.id);
  });

  test("refreshes category scope", async ({ tx, testUser }) => {
    const cat = await seedCategory(tx, { userId: testUser.id, name: "News" });
    const { feed: f1, subscription: s1 } = await seedFeedWithSubscription(
      tx,
      testUser.id,
    );
    const { feed: f2 } = await seedFeedWithSubscription(tx, testUser.id);

    // Assign s1 to category
    await tx
      .update(subscriptions)
      .set({ categoryId: cat.id })
      .where(eq(subscriptions.id, s1.id));

    vi.mocked(ingestItems).mockResolvedValue({ success: true } as any);

    const result = await refreshFeeds(tx, testUser.id, {
      scope: "category",
      id: cat.id,
    });

    expect(result).toBeUndefined();
    expect(ingestItems).toHaveBeenCalledTimes(1);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), f1.id);
    expect(ingestItems).not.toHaveBeenCalledWith(expect.anything(), f2.id);
  });

  test("throws if all feeds in a batch fail", async ({ tx, testUser }) => {
    await seedFeedWithSubscription(tx, testUser.id);
    vi.mocked(ingestItems).mockRejectedValue(new Error("Network fail"));

    await expect(
      refreshFeeds(tx, testUser.id, { scope: "global" }),
    ).rejects.toThrow("All feeds failed to refresh");
  });
});
