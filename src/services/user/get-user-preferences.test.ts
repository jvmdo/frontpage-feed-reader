import * as schema from "@/db/schema";
import { userPreferences } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { getUserPreferences } from "./get-user-preferences";

describe("getUserPreferences", () => {
  test("returns null if no preferences exist for the user", async ({
    tx,
    testUser,
  }) => {
    const result = await getUserPreferences(tx, testUser.id);
    expect(result).toBeNull();
  });

  test("returns user preferences if they exist", async ({ tx, testUser }) => {
    // 1. Setup
    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 1800,
    });

    // 2. Act
    const result = await getUserPreferences(tx, testUser.id);

    // 3. Assert
    expect(result).not.toBeNull();
    expect(result?.refreshInterval).toBe(1800);
  });

  test("does not return preferences from other users", async ({
    tx,
    testUser,
  }) => {
    // 1. Setup - user A (testUser) and user B
    const otherUserId = "other-user-123";

    // Must seed the user record first due to FK constraint
    await tx.insert(schema.user).values({
      id: otherUserId,
      name: "Other User",
      email: "other@example.com",
    });

    await tx.insert(userPreferences).values({
      userId: otherUserId,
      refreshInterval: 900,
    });

    // 2. Act
    const result = await getUserPreferences(tx, testUser.id);

    // 3. Assert
    expect(result).toBeNull();
  });
});
