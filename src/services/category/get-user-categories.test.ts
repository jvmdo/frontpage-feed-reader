import { describe, expect } from "vitest";
import { test } from "@/tests/test-extend";
import { seedCategory, seedUser } from "@/tests/seeding";
import { getUserCategories } from "./get-user-categories";

describe("getUserCategories", () => {
  test("returns an empty list when the user has no categories", async ({
    tx,
    testUser,
  }) => {
    const result = await getUserCategories(tx, testUser.id);
    expect(result).toEqual([]);
  });

  test("returns all categories for the user, ordered by name", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    await seedCategory(tx, { userId: testUser.id, name: "Zebra" });
    await seedCategory(tx, { userId: testUser.id, name: "Apple" });
    await seedCategory(tx, { userId: testUser.id, name: "Mango" });

    // Act
    const result = await getUserCategories(tx, testUser.id);

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].name).toBe("Apple");
    expect(result[1].name).toBe("Mango");
    expect(result[2].name).toBe("Zebra");
  });

  test("does not return categories belonging to other users", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    await seedCategory(tx, { userId: testUser.id, name: "User Cat" });
    await seedCategory(tx, { userId: otherUser.id, name: "Other Cat" });

    // Act
    const result = await getUserCategories(tx, testUser.id);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("User Cat");
    expect(result[0].userId).toBe(testUser.id);
  });
});
