/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryNotFoundError, DuplicateCategoryError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { updateCategory } from "@/services/category/update-category";
import { updateCategoryAction } from "./update-category-action";

vi.mock("@/services/category/update-category");
vi.mock("@/lib/session");

describe("updateCategoryAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if name is empty", async () => {
    const result = await updateCategoryAction({ id: 1, name: "" });

    expect(result).toEqual({
      success: false,
      error: "Category name is required",
      code: "VALIDATION_ERROR",
    });
  });

  it("returns validation error if name is too long", async () => {
    const result = await updateCategoryAction({ id: 1, name: "a".repeat(51) });

    expect(result).toEqual({
      success: false,
      error: "Category name must be less than 50 characters",
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await updateCategoryAction({ id: 1, name: "Tech" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update a category.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and updated category data", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockCategory = {
      id: 1,
      userId: "user-123",
      name: "Tech-Updated",
      createdAt: new Date(),
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateCategory).mockResolvedValueOnce(mockCategory as any);

    const result = await updateCategoryAction({ id: 1, name: "Tech-Updated" });

    expect(result).toEqual({
      success: true,
      data: mockCategory,
    });
    expect(updateCategory).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      1,
      "Tech-Updated",
    );
  });

  it("returns duplicate category error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateCategory).mockRejectedValueOnce(
      new DuplicateCategoryError(),
    );

    const result = await updateCategoryAction({ id: 1, name: "Existing" });

    expect(result).toEqual({
      success: false,
      error: "A category with this name already exists.",
      code: "DUPLICATE_CATEGORY",
    });
  });

  it("returns category not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateCategory).mockRejectedValueOnce(
      new CategoryNotFoundError(),
    );

    const result = await updateCategoryAction({ id: 999, name: "New Name" });

    expect(result).toEqual({
      success: false,
      error: "The category could not be found.",
      code: "CATEGORY_NOT_FOUND",
    });
  });

  it("returns internal error on unexpected failures", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateCategory).mockRejectedValueOnce(new Error("DB Down"));

    const result = await updateCategoryAction({ id: 1, name: "Tech" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
