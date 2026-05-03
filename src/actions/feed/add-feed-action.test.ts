/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { ingestItems } from "@/services/ingestion/feed-ingestion";
import { createSubscription } from "@/services/subscription/create-subscription";
import { addFeedAction } from "./add-feed-action";

vi.mock("@/services/subscription/create-subscription");
vi.mock("@/services/ingestion/feed-ingestion");
vi.mock("@/lib/session");

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
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to add a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and subscription data when addition is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockResult = {
      subscription: {
        id: "sub-123",
        userId: "user-123",
        feedId: "feed-123",
      },
      feed: {
        id: "feed-123",
      },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockResolvedValueOnce(mockResult as any);
    vi.mocked(ingestItems).mockResolvedValueOnce({ success: true } as any);

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: true,
      data: mockResult,
    });
    expect(createSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "https://example.com/feed.xml",
      undefined,
    );
    expect(ingestItems).toHaveBeenCalledWith(expect.anything(), "feed-123");
  });

  it("returns success and subscription data when addition with category is successful", async () => {
    const mockSession = { user: { id: "user-123" } };
    const mockResult = {
      subscription: {
        id: "sub-123",
        userId: "user-123",
        feedId: "feed-123",
        categoryId: 10,
      },
      feed: {
        id: "feed-123",
      },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockResolvedValueOnce(mockResult as any);
    vi.mocked(ingestItems).mockResolvedValueOnce({ success: true } as any);

    const result = await addFeedAction({
      url: "https://example.com/feed.xml",
      categoryId: 10,
    });

    expect(result).toEqual({
      success: true,
      data: mockResult,
    });
    expect(createSubscription).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "https://example.com/feed.xml",
      10,
    );
  });

  it("returns friendly error when FeedNotFoundError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockRejectedValueOnce(
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
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockRejectedValueOnce(
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
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockRejectedValueOnce(
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
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockRejectedValueOnce(new FeedNetworkError());

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
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(createSubscription).mockRejectedValueOnce(
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
