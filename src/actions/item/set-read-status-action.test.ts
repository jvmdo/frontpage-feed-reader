/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { setReadStatus } from "@/services/item/set-read-status";
import { setReadStatusAction } from "./set-read-status-action";

vi.mock("@/services/item/set-read-status");
vi.mock("@/lib/session");

describe("setReadStatusAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await setReadStatusAction({
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

    const result = await setReadStatusAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to change read status.",
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
    vi.mocked(setReadStatus).mockResolvedValueOnce(mockState as any);

    const result = await setReadStatusAction({ itemId: 123 });

    expect(result).toEqual({
      success: true,
      data: mockState,
    });
    expect(setReadStatus).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      undefined,
    );
  });

  it("returns success and updated state when marking as unread", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockState = {
      userId: "user-123",
      itemId: 123,
      readAt: null,
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(setReadStatus).mockResolvedValueOnce(mockState as any);

    const result = await setReadStatusAction({ itemId: 123, isRead: false });

    expect(result).toEqual({
      success: true,
      data: mockState,
    });
    expect(setReadStatus).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      false,
    );
  });

  it("returns internal error if service fails", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(setReadStatus).mockRejectedValueOnce(new Error("DB error"));

    const result = await setReadStatusAction({ itemId: 123 });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
