/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { getSubscription } from "@/services/subscription/get-subscription";
import { getSubscriptionByFeedId } from "@/services/subscription/get-subscription-by-feed-id";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { refreshFeedAction } from "./refresh-feed-action";

vi.mock("@/services/subscription/get-subscription");
vi.mock("@/services/subscription/get-subscription-by-feed-id");
vi.mock("@/services/ingestion/feed-ingestion");
vi.mock("@/lib/session");

describe("refreshFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await refreshFeedAction({} as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await refreshFeedAction({ subscriptionId: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to refresh a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success when refreshing by subscriptionId", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockRow = {
      subscription: { id: 123 },
      feed: { id: 456, url: "https://example.com/feed" },
    };
    const mockUpdatedRow = {
      ...mockRow,
      feed: { ...mockRow.feed, healthStatus: "healthy" },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscription)
      .mockResolvedValueOnce(mockRow as any)
      .mockResolvedValueOnce(mockUpdatedRow as any);
    vi.mocked(ingestItems).mockResolvedValueOnce({ success: true } as any);

    const result = await refreshFeedAction({ subscriptionId: 123 });

    expect(result.success).toBe(true);
    expect(getSubscription).toHaveBeenCalledWith(expect.anything(), "user-123", 123);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), 456);
  });

  it("returns success when refreshing by feedId", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockRow = {
      subscription: { id: 123 },
      feed: { id: 456, url: "https://example.com/feed" },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscriptionByFeedId).mockResolvedValueOnce(mockRow as any);
    vi.mocked(getSubscription).mockResolvedValueOnce(mockRow as any);
    vi.mocked(ingestItems).mockResolvedValueOnce({ success: true } as any);

    const result = await refreshFeedAction({ feedId: 456 });

    expect(result.success).toBe(true);
    expect(getSubscriptionByFeedId).toHaveBeenCalledWith(expect.anything(), "user-123", 456);
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), 456);
  });

  it("returns error if subscription is not found", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscription).mockResolvedValueOnce(undefined as any);

    const result = await refreshFeedAction({ subscriptionId: 999 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });

  it("handles ingest errors and returns fallback data", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockRow = {
      subscription: { id: 123 },
      feed: { id: 456, url: "https://example.com/feed" },
    };
    const mockErrorRow = {
      ...mockRow,
      feed: { ...mockRow.feed, healthStatus: "error" },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscription)
      .mockResolvedValueOnce(mockRow as any) // Initial lookup
      .mockResolvedValueOnce(mockErrorRow as any); // Fallback lookup
    vi.mocked(ingestItems).mockRejectedValueOnce(new FeedNotFoundError());

    const result = await refreshFeedAction({ subscriptionId: 123 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't reach this URL. Please double-check for typos.",
      code: "FEED_NOT_FOUND",
      data: {
        subscription: mockErrorRow.subscription,
        feed: mockErrorRow.feed,
      },
    });
  });
});
