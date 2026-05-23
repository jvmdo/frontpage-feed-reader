import { eq } from "drizzle-orm";
import { userPreferences } from "@/db/schema";
import { test } from "@/tests/test-extend";
import { updateUserPreferences } from "./update-user-preferences";

describe("updateUserPreferences", () => {
  test("creates new preferences if they don't exist", async ({
    tx,
    testUser,
  }) => {
    const data = {
      refreshInterval: 900,
    };

    await updateUserPreferences(tx, testUser.id, data);

    const [inserted] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, testUser.id));

    expect(inserted).toBeDefined();
    expect(inserted.refreshInterval).toBe(900);
  });

  test("updates existing preferences (upsert)", async ({ tx, testUser }) => {
    // 1. Initial setup
    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 300,
    });

    // 2. Update
    const updateData = {
      refreshInterval: 1800,
    };

    await updateUserPreferences(tx, testUser.id, updateData);

    const [updated] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, testUser.id));

    expect(updated.refreshInterval).toBe(1800);
  });

  test("partially updates preferences without affecting other fields", async ({
    tx,
    testUser,
  }) => {
    await tx.insert(userPreferences).values({
      userId: testUser.id,
      refreshInterval: 300,
      markedAllReadAt: new Date(2024, 0, 1),
    });

    await updateUserPreferences(tx, testUser.id, {
      refreshInterval: 3600,
    });

    const [result] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, testUser.id));

    expect(result.refreshInterval).toBe(3600);
    expect(result.markedAllReadAt).toEqual(new Date(2024, 0, 1));
  });
});
