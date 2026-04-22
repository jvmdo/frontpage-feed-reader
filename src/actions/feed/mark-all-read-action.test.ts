/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CategoryNotFoundError,
  InvalidMarkAllReadScopeError,
  MarkAllReadIdRequiredError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { markAllRead } from "@/services/feed/mark-all-read";
import { markAllReadAction } from "./mark-all-read-action";

vi.mock("@/services/feed/mark-all-read");
vi.mock("@/lib/session");

describe("markAllReadAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await markAllReadAction({ scope: "invalid" as any });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await markAllReadAction({ scope: "global" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to mark items as read.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success when markAllRead is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markAllRead).mockResolvedValueOnce(undefined as any);

    const result = await markAllReadAction({ scope: "global" });

    expect(result).toEqual({ success: true });
    expect(markAllRead).toHaveBeenCalledWith(expect.anything(), "user-123", {
      scope: "global",
    });
  });

  it("returns friendly error when CategoryNotFoundError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markAllRead).mockRejectedValueOnce(new CategoryNotFoundError());

    const result = await markAllReadAction({ scope: "category", id: 123 });

    expect(result).toEqual({
      success: false,
      error: "The category could not be found.",
      code: "CATEGORY_NOT_FOUND",
    });
  });

  it("returns friendly error when SubscriptionNotFoundError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markAllRead).mockRejectedValueOnce(
      new SubscriptionNotFoundError(),
    );

    const result = await markAllReadAction({ scope: "feed", id: 123 });

    expect(result).toEqual({
      success: false,
      error: "The subscription could not be found.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });

  it("returns error message when MarkAllReadIdRequiredError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markAllRead).mockRejectedValueOnce(
      new MarkAllReadIdRequiredError("category"),
    );

    const result = await markAllReadAction({ scope: "category" });

    expect(result).toEqual({
      success: false,
      error: "Category ID is required for category scope",
      code: "MARK_ALL_READ_ID_REQUIRED",
    });
  });

  it("returns error message when InvalidMarkAllReadScopeError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    // This shouldn't happen due to Zod, but testing the catch block
    vi.mocked(markAllRead).mockRejectedValueOnce(
      new InvalidMarkAllReadScopeError("invalid"),
    );

    const result = await markAllReadAction({ scope: "global" });

    expect(result).toEqual({
      success: false,
      error: "Invalid scope: invalid",
      code: "INVALID_MARK_ALL_READ_SCOPE",
    });
  });

  it("returns internal error on unexpected errors", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(markAllRead).mockRejectedValueOnce(new Error("Unexpected"));

    const result = await markAllReadAction({ scope: "global" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
