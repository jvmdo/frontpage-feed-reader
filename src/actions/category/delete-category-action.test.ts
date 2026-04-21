/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { deleteCategory } from "@/services/category/delete-category";
import { deleteCategoryAction } from "./delete-category-action";

vi.mock("@/services/category/delete-category");
vi.mock("@/lib/session");

describe("deleteCategoryAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if id is missing or invalid", async () => {
    const result = await deleteCategoryAction({ id: "invalid" } as any);

    expect(result).toEqual({
      success: false,
      error: "Invalid input: expected number, received string",
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await deleteCategoryAction({ id: 1 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete a category.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and revalidates path", async () => {
    const mockSession = { user: { id: "user-123" } };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteCategory).mockResolvedValueOnce(undefined as any);

    const result = await deleteCategoryAction({ id: 1 });

    expect(result).toEqual({
      success: true,
    });
    expect(deleteCategory).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      1,
    );
  });

  it("returns category not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteCategory).mockRejectedValueOnce(
      new CategoryNotFoundError(),
    );

    const result = await deleteCategoryAction({ id: 999 });

    expect(result).toEqual({
      success: false,
      error: "The category could not be found.",
      code: "CATEGORY_NOT_FOUND",
    });
  });

  it("returns internal error on unexpected failures", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteCategory).mockRejectedValueOnce(new Error("DB Down"));

    const result = await deleteCategoryAction({ id: 1 });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
