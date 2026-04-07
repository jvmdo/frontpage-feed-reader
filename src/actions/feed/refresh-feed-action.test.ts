/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedNotFoundError } from "@/lib/errors";
import * as parserModule from "@/lib/feed/parser";
import { getCurrentSession } from "@/lib/session";
import { getSubscriptionWithFeed } from "@/services/feed/get-subscriptions-with-feed";
import { updateFeedMetadata } from "@/services/feed/update-feed-metadata";
import { refreshFeedAction } from "./refresh-feed-action";

vi.mock("@/services/feed/get-subscriptions-with-feed");
vi.mock("@/services/feed/update-feed-metadata");
vi.mock("@/lib/session");
vi.mock("@/lib/feed/parser");

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
    const mockMetadata = { title: "New Title", description: "New Desc" };
    const mockUpdatedFeed = {
      ...mockRow.feed,
      ...mockMetadata,
      healthStatus: "healthy",
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscriptionWithFeed).mockResolvedValueOnce(mockRow as any);
    vi.mocked(parserModule.fetchFeedMetadata).mockResolvedValueOnce(
      mockMetadata as any,
    );
    vi.mocked(updateFeedMetadata).mockResolvedValueOnce(mockUpdatedFeed as any);

    const result = await refreshFeedAction({ id: 123 });

    expect(result).toEqual({
      success: true,
      data: {
        subscription: mockRow.subscription,
        feed: mockUpdatedFeed,
      },
    });
    expect(parserModule.fetchFeedMetadata).toHaveBeenCalledWith(
      mockRow.feed.url,
    );
    expect(updateFeedMetadata).toHaveBeenCalledWith(
      expect.anything(),
      mockRow.feed.id,
      expect.objectContaining({
        healthStatus: "healthy",
      }),
    );
  });

  it("handles fetch errors and updates feed status to error", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockRow = {
      subscription: { id: 123 },
      feed: { id: 456, url: "https://example.com/feed" },
    };
    const mockErrorFeed = { ...mockRow.feed, healthStatus: "error" };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getSubscriptionWithFeed).mockResolvedValueOnce(mockRow as any);
    vi.mocked(parserModule.fetchFeedMetadata).mockRejectedValueOnce(
      new FeedNotFoundError(),
    );
    vi.mocked(updateFeedMetadata).mockResolvedValueOnce(mockErrorFeed as any);

    const result = await refreshFeedAction({ id: 123 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't reach this URL. Please double-check for typos.",
      code: "FEED_NOT_FOUND",
      data: {
        subscription: mockRow.subscription,
        feed: mockErrorFeed,
      },
    });
    expect(updateFeedMetadata).toHaveBeenCalledWith(
      expect.anything(),
      mockRow.feed.id,
      expect.objectContaining({
        healthStatus: "error",
      }),
    );
  });
});
