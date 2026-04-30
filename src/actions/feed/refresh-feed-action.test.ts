/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedNotFoundError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { getSubscription } from "@/services/subscription/get-subscription";
import { ingestItems } from "@/services/feed-ingestion";
import { refreshFeedAction } from "./refresh-feed-action";

vi.mock("@/services/subscription/get-subscription");
vi.mock("@/services/feed-ingestion");
vi.mock("@/lib/session");

describe("refreshFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await refreshFeedAction({ id: "not-a-number" } as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await refreshFeedAction({ id: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to refresh a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and updated data when refresh is successful", async () => {
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
      .mockResolvedValueOnce(mockRow as any) // Initial check
      .mockResolvedValueOnce(mockUpdatedRow as any); // Updated data
    vi.mocked(ingestItems).mockResolvedValueOnce({ success: true } as any);

    const result = await refreshFeedAction({ id: 123 });

    expect(result).toEqual({
      success: true,
      data: {
        subscription: mockUpdatedRow.subscription,
        feed: mockUpdatedRow.feed,
      },
    });
    expect(ingestItems).toHaveBeenCalledWith(
      expect.anything(),
      mockRow.feed.id,
    );
  });

  it("handles fetch errors and updates feed status to error", async () => {
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
      .mockResolvedValueOnce(mockRow as any) // Initial check
      .mockResolvedValueOnce(mockErrorRow as any); // Data with error status
    vi.mocked(ingestItems).mockRejectedValueOnce(
      new FeedNotFoundError(),
    );

    const result = await refreshFeedAction({ id: 123 });

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
