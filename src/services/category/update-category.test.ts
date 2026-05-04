import { eq } from "drizzle-orm";
import { describe, expect } from "vitest";
import { categories } from "@/db/schema";
import { CategoryNotFoundError, DuplicateCategoryError } from "@/lib/errors";
import { seedUser } from "@/tests/seeding";
import { test } from "@/tests/test-extend";
import { createCategory } from "./create-category";
import { updateCategory } from "./update-category";

describe("updateCategory", () => {
  test("updates a category name and color successfully", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const category = await createCategory(tx, testUser.id, "Old Name");
    const newName = "New Name";
    const newColor = "#dc2626";

    // Act
    const updatedCategory = await updateCategory(
      tx,
      testUser.id,
      category.id,
      newName,
      newColor,
    );

    // Assert
    expect(updatedCategory.name).toBe(newName);
    expect(updatedCategory.color).toBe(newColor);

    const dbCategory = await tx.query.categories.findFirst({
      where: eq(categories.id, category.id),
    });
    expect(dbCategory?.name).toBe(newName);
    expect(dbCategory?.color).toBe(newColor);
  });

  test("throws CategoryNotFoundError when category does not exist", async ({
    tx,
    testUser,
  }) => {
    // Act & Assert
    await expect(
      updateCategory(tx, testUser.id, 999, "New Name"),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  test("throws CategoryNotFoundError when category belongs to another user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    const category = await createCategory(tx, otherUser.id, "Other Category");

    // Act & Assert
    await expect(
      updateCategory(tx, testUser.id, category.id, "New Name"),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  test("throws DuplicateCategoryError when new name is already taken by the same user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const category1 = await createCategory(tx, testUser.id, "Category 1");
    await createCategory(tx, testUser.id, "Category 2");

    // Act & Assert
    await expect(
      updateCategory(tx, testUser.id, category1.id, "Category 2"),
    ).rejects.toThrow(DuplicateCategoryError);
  });

  test("allows updating name to the same name (no-op)", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const category = await createCategory(tx, testUser.id, "Same Name");

    // Act
    const updatedCategory = await updateCategory(
      tx,
      testUser.id,
      category.id,
      "Same Name",
    );

    // Assert
    expect(updatedCategory.name).toBe("Same Name");
  });

  test("allows updating to a name taken by another user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const otherUser = await seedUser(tx);
    await createCategory(tx, otherUser.id, "Shared Name");
    const category = await createCategory(tx, testUser.id, "My Category");

    // Act
    const updatedCategory = await updateCategory(
      tx,
      testUser.id,
      category.id,
      "Shared Name",
    );

    // Assert
    expect(updatedCategory.name).toBe("Shared Name");
  });
});
