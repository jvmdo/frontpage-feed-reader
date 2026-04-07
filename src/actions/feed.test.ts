/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
  SubscriptionNotFoundError,
} from "@/lib/errors";
import * as parserModule from "@/lib/feed/parser";
import * as sessionModule from "@/lib/session";
import * as feedService from "@/services/feed";
import {
  addFeedAction,
  refreshFeedAction,
  removeSubscriptionAction,
  updateSubscriptionAction,
} from "./feed";

vi.mock("@/services/feed");
vi.mock("@/lib/session");
vi.mock("@/lib/feed/parser");

describe("addFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await addFeedAction({ url: "invalid-url" });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(null);

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to add a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and subscription data when addition is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockSubscription = {
      id: "sub-123",
      userId: "user-123",
      feedId: "feed-123",
    };

    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockResolvedValueOnce(
      mockSubscription as any,
    );

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: true,
      data: mockSubscription,
    });
    expect(feedService.addFeedToUser).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "https://example.com/feed.xml",
    );
  });

  it("returns friendly error when FeedNotFoundError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockRejectedValueOnce(
      new FeedNotFoundError(),
    );

    const result = await addFeedAction({ url: "https://example.com/404.xml" });

    expect(result).toEqual({
      success: false,
      error: "We couldn't reach this URL. Please double-check for typos.",
      code: "FEED_NOT_FOUND",
    });
  });

  it("returns friendly error when FeedUnavailableError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockRejectedValueOnce(
      new FeedUnavailableError(),
    );

    const result = await addFeedAction({ url: "https://example.com/500.xml" });

    expect(result).toEqual({
      success: false,
      error:
        "The source site is currently slow or unavailable. Try again in a few minutes.",
      code: "FEED_UNAVAILABLE",
    });
  });

  it("returns friendly error when FeedInvalidFormatError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockRejectedValueOnce(
      new FeedInvalidFormatError(),
    );

    const result = await addFeedAction({
      url: "https://example.com/invalid.xml",
    });

    expect(result).toEqual({
      success: false,
      error:
        "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
      code: "FEED_INVALID_FORMAT",
    });
  });

  it("returns friendly error when FeedNetworkError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockRejectedValueOnce(
      new FeedNetworkError(),
    );

    const result = await addFeedAction({
      url: "https://example.com/network.xml",
    });

    expect(result).toEqual({
      success: false,
      error:
        "A network error occurred while reaching the feed. Please try again.",
      code: "FEED_NETWORK_ERROR",
    });
  });

  it("returns internal error on unexpected errors", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.addFeedToUser).mockRejectedValueOnce(
      new Error("Unexpected"),
    );

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});

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
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(null);

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

    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.updateSubscription).mockResolvedValueOnce(
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
    expect(feedService.updateSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
      { customTitle: "New Title" },
    );
  });

  it("returns subscription not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.updateSubscription).mockRejectedValueOnce(
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

describe("removeSubscriptionAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input is invalid", async () => {
    const result = await removeSubscriptionAction({
      id: "not-a-number",
    } as any);

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(null);

    const result = await removeSubscriptionAction({ id: 123 });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to remove a subscription.",
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

    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.deleteSubscription).mockResolvedValueOnce(
      mockDeletedSubscription as any,
    );

    const result = await removeSubscriptionAction({ id: 123 });

    expect(result).toEqual({
      success: true,
      data: mockDeletedSubscription,
    });
    expect(feedService.deleteSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      123,
    );
  });

  it("returns subscription not found error", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.deleteSubscription).mockRejectedValueOnce(
      new SubscriptionNotFoundError(),
    );

    const result = await removeSubscriptionAction({ id: 999 });

    expect(result).toEqual({
      success: false,
      error: "We couldn't find this subscription.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  });
});

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
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(null);

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

    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.getSubscriptionWithFeed).mockResolvedValueOnce(
      mockRow as any,
    );
    vi.mocked(parserModule.fetchFeedMetadata).mockResolvedValueOnce(
      mockMetadata as any,
    );
    vi.mocked(feedService.updateFeedMetadata).mockResolvedValueOnce(
      mockUpdatedFeed as any,
    );

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
    expect(feedService.updateFeedMetadata).toHaveBeenCalledWith(
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

    vi.mocked(sessionModule.getCurrentSession).mockResolvedValueOnce(
      mockSession as any,
    );
    vi.mocked(feedService.getSubscriptionWithFeed).mockResolvedValueOnce(
      mockRow as any,
    );
    vi.mocked(parserModule.fetchFeedMetadata).mockRejectedValueOnce(
      new FeedNotFoundError(),
    );
    vi.mocked(feedService.updateFeedMetadata).mockResolvedValueOnce(
      mockErrorFeed as any,
    );

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
    expect(feedService.updateFeedMetadata).toHaveBeenCalledWith(
      expect.anything(),
      mockRow.feed.id,
      expect.objectContaining({
        healthStatus: "error",
      }),
    );
  });
});
