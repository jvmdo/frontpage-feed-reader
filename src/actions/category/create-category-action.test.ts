/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateCategoryError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { createCategory } from "@/services/category/create-category";
import { createCategoryAction } from "./create-category-action";

vi.mock("@/services/category/create-category");
vi.mock("@/lib/session");

describe("createCategoryAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if name is empty", async () => {
    const result = await createCategoryAction({ name: "" });

    expect(result).toEqual({
      success: false,
      error: "Category name is required",
      code: "VALIDATION_ERROR",
    });
  });

  it("returns validation error if name is too long", async () => {
    const result = await createCategoryAction({ name: "a".repeat(51) });

    expect(result).toEqual({
      success: false,
      error: "Category name must be less than 50 characters",
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await createCategoryAction({ name: "Tech" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create a category.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and created category data", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockCategory = {
      id: 1,
      userId: "user-123",
      name: "Tech",
      createdAt: new Date(),
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createCategory).mockResolvedValueOnce(mockCategory as any);

    const result = await createCategoryAction({ name: "Tech" });

    expect(result).toEqual({
      success: true,
      data: mockCategory,
    });
    expect(createCategory).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "Tech",
    );
  });

  it("returns duplicate category error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createCategory).mockRejectedValueOnce(
      new DuplicateCategoryError(),
    );

    const result = await createCategoryAction({ name: "Tech" });

    expect(result).toEqual({
      success: false,
      error: "A category with this name already exists.",
      code: "DUPLICATE_CATEGORY",
    });
  });

  it("returns internal error on unexpected failures", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createCategory).mockRejectedValueOnce(new Error("DB Down"));

    const result = await createCategoryAction({ name: "Tech" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
