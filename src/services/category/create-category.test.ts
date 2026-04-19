import { describe, expect } from "vitest";
import { eq } from "drizzle-orm";
import { categories } from "@/db/schema";
import { DuplicateCategoryError } from "@/lib/errors";
import { test } from "@/tests/test-extend";
import { seedUser } from "@/tests/seeding";
import { createCategory } from "./create-category";

describe("createCategory", () => {
  test("creates a new category successfully", async ({ tx, testUser }) => {
    // Arrange
    const categoryName = "Tech";

    // Act
    const newCategory = await createCategory(tx, testUser.id, categoryName);

    // Assert
    expect(newCategory).toBeDefined();
    expect(newCategory.name).toBe(categoryName);
    expect(newCategory.userId).toBe(testUser.id);

    const dbCategory = await tx.query.categories.findFirst({
      where: eq(categories.id, newCategory.id),
    });
    expect(dbCategory).toBeDefined();
    expect(dbCategory?.name).toBe(categoryName);
  });

  test("throws DuplicateCategoryError when name already exists for the user", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const categoryName = "Design";
    await createCategory(tx, testUser.id, categoryName);

    // Act & Assert
    await expect(
      createCategory(tx, testUser.id, categoryName),
    ).rejects.toThrow(DuplicateCategoryError);
  });

  test("allows different users to have categories with the same name", async ({
    tx,
    testUser,
  }) => {
    // Arrange
    const categoryName = "General";
    const otherUser = await seedUser(tx);
    
    // Create an other user category in the db first
    await tx.insert(categories).values({
      userId: otherUser.id,
      name: categoryName,
    });

    // Act
    const newCategory = await createCategory(tx, testUser.id, categoryName);

    // Assert
    expect(newCategory.name).toBe(categoryName);
    expect(newCategory.userId).toBe(testUser.id);
    
    const allCategories = await tx
      .select()
      .from(categories)
      .where(eq(categories.name, categoryName));
      
    expect(allCategories.length).toBe(2);
  });
});
