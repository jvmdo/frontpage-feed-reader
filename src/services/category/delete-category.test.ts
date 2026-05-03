import { eq } from "drizzle-orm";
import { describe, expect } from "vitest";
import { categories } from "@/db/schema";
import { CategoryNotFoundError } from "@/lib/errors";
import { seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { createCategory } from "./create-category";
import { deleteCategory } from "./delete-category";

describe("deleteCategory", () => {
  test("deletes a category successfully", async ({ tx, testUser }) => {
    // Arrange
    const category = await createCategory(tx, testUser.id, "To Delete");

    // Act
    await deleteCategory(tx, testUser.id, category.id);

    // Assert
    const dbCategory = await tx.query.categories.findFirst({
      where: eq(categories.id, category.id),
    });
    expect(dbCategory).toBeUndefined();
  });

  test("throws CategoryNotFoundError when category does not exist", async ({
    tx,
    testUser,
  }) => {
    // Act & Assert
    await expect(deleteCategory(tx, testUser.id, 999)).rejects.toThrow(
      CategoryNotFoundError,
    );
  });

  test("throws CategoryNotFoundError when category belongs to another user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    const category = await createCategory(tx, otherUser.id, "Other User Category");

    // Act & Assert
    await expect(deleteCategory(tx, testUser.id, category.id)).rejects.toThrow(
      CategoryNotFoundError,
    );
  });
});
