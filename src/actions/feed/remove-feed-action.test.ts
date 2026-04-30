/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { deleteSubscription } from "@/services/subscription/delete-subscription";
import { removeFeedAction } from "./remove-feed-action";

vi.mock("@/services/subscription/delete-subscription");
vi.mock("@/lib/session");

describe("removeFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await removeFeedAction({
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

    const result = await removeFeedAction({ id: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to remove a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and deleted subscription data", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockDeletedSubscription = {
      id: 123,
      userId: "user-123",
      feedId: "feed-456",
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteSubscription).mockResolvedValueOnce(
      mockDeletedSubscription as any,
    );

    const result = await removeFeedAction({ id: 123 });

    expect(result).toEqual({
      success: true,
      data: mockDeletedSubscription,
    });
    expect(deleteSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
    );
  });

  it("returns subscription not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(deleteSubscription).mockRejectedValueOnce(
      new SubscriptionNotFoundError(),
    );

    const result = await removeFeedAction({ id: 999 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });
});
