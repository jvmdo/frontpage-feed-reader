/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { markItemAsRead } from "@/services/feed/mark-item-as-read";
import { markAsReadAction } from "./mark-as-read-action";

vi.mock("@/services/feed/mark-item-as-read");
vi.mock("@/lib/session");

describe("markAsReadAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await markAsReadAction({
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

    const result = await markAsReadAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to perform this action.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and updated state", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockState = {
      userId: "user-123",
      itemId: 123,
      readAt: new Date(),
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markItemAsRead).mockResolvedValueOnce(mockState as any);

    const result = await markAsReadAction({ itemId: 123 });

    expect(result).toEqual({
      success: true,
      data: mockState,
    });
    expect(markItemAsRead).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
    );
  });

  it("returns internal error if service fails", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markItemAsRead).mockRejectedValueOnce(new Error("DB error"));

    const result = await markAsReadAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
