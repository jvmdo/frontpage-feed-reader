import { seedFeedWithSubscription, seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { getSubscription } from "./get-subscription";

describe("getSubscription", () => {
  test("returns subscription joined with feed data", async ({
    tx,
    testUser,
  }) => {
    const { subscription: sub } = await seedFeedWithSubscription(
      tx,
      testUser.id,
      {
        url: "https://example.com/rss",
      },
    );

    const result = await getSubscription(tx, testUser.id, sub.id);

    expect(result).toBeDefined();
    expect(result?.subscription.id).toBe(sub.id);
    expect(result?.feed.url).toBe("https://example.com/rss");
  });

  test("returns undefined if the subscription belongs to another user", async ({
    tx,
    testUser,
  }) => {
    const otherUser = await seedUser(tx);

    const { subscription: sub } = await seedFeedWithSubscription(
      tx,
      otherUser.id,
    );

    const result = await getSubscription(tx, testUser.id, sub.id);

    expect(result).toBeUndefined();
  });

  test("returns undefined if the subscription does not exist", async ({
    tx,
    testUser,
  }) => {
    const result = await getSubscription(tx, testUser.id, 9999);
    expect(result).toBeUndefined();
  });
});
