/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { toggleBookmark } from "@/services/item/toggle-bookmark";
import { toggleBookmarkAction } from "./toggle-bookmark-action";

vi.mock("@/services/item/toggle-bookmark");
vi.mock("@/lib/session");

describe("toggleBookmarkAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await toggleBookmarkAction({
      itemId: "not-a-number",
    } as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await toggleBookmarkAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to bookmark items.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and updated state", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockState = {
      userId: "user-123",
      itemId: 123,
      bookmarkedAt: new Date(),
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(toggleBookmark).mockResolvedValueOnce(mockState as any);

    const result = await toggleBookmarkAction({ itemId: 123 });

    expect(result).toEqual({
      success: true,
      data: mockState,
    });
    expect(toggleBookmark).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
    );
  });

  it("returns internal error if service fails", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(toggleBookmark).mockRejectedValueOnce(new Error("DB error"));

    const result = await toggleBookmarkAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
