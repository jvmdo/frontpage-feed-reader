/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { updateSubscription } from "@/services/feed/update-subscription";
import { updateSubscriptionAction } from "./update-subscription-action";

vi.mock("@/services/feed/update-subscription");
vi.mock("@/lib/session");

describe("updateSubscriptionAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await updateSubscriptionAction({
      id: "not-a-number",
    } as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await updateSubscriptionAction({
      id: 123,
      customTitle: "New Title",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update a subscription.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and updated subscription data", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockUpdatedSubscription = {
      id: 123,
      userId: "user-123",
      customTitle: "New Title",
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateSubscription).mockResolvedValueOnce(
      mockUpdatedSubscription as any,
    );

    const result = await updateSubscriptionAction({
      id: 123,
      customTitle: "New Title",
    });

    expect(result).toEqual({
      success: true,
      data: mockUpdatedSubscription,
    });
    expect(updateSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      { customTitle: "New Title", categoryId: undefined },
    );
  });

  it("handles surgical updates correctly (only categoryId)", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockUpdatedSubscription = {
      id: 123,
      userId: "user-123",
      categoryId: 456,
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateSubscription).mockResolvedValueOnce(
      mockUpdatedSubscription as any,
    );

    const result = await updateSubscriptionAction({
      id: 123,
      categoryId: 456,
    });

    expect(result.success).toBe(true);
    expect(updateSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      { customTitle: undefined, categoryId: 456 },
    );
  });

  it("allows setting categoryId to null (uncategorize)", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateSubscription).mockResolvedValueOnce({} as any);

    await updateSubscriptionAction({
      id: 123,
      categoryId: null,
    });

    expect(updateSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      { customTitle: undefined, categoryId: null },
    );
  });

  it("returns subscription not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(updateSubscription).mockRejectedValueOnce(
      new SubscriptionNotFoundError(),
    );

    const result = await updateSubscriptionAction({
      id: 999,
      customTitle: "Title",
    });

    expect(result).toEqual({
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });
});
