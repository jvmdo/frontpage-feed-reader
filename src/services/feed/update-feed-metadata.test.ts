import { eq } from "drizzle-orm";
import { feeds } from "@/db/schema";
import { seedFeed } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { updateFeedMetadata } from "./update-feed-metadata";

describe("updateFeedMetadata", () => {
  test("updates the feed fields correctly", async ({ tx }) => {
    // 1. Create a feed
    const feed = await seedFeed(tx, {
      url: "https://a.com",
      title: "A",
      healthStatus: "unknown",
    });

    // 2. Update
    const now = new Date();
    const updated = await updateFeedMetadata(tx, feed.id, {
      title: "New Title",
      healthStatus: "healthy",
      lastFetchedAt: now,
    });

    // 3. Verify
    expect(updated.title).toBe("New Title");
    expect(updated.healthStatus).toBe("healthy");
    expect(updated.lastFetchedAt?.getTime()).toBe(now.getTime());

    const [dbFeed] = await tx.select().from(feeds).where(eq(feeds.id, feed.id));
    expect(dbFeed.title).toBe("New Title");
    expect(dbFeed.url).toBe("https://a.com"); // Should remain unchanged
  });
});
