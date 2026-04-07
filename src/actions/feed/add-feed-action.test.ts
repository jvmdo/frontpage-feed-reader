/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { addFeedToUser } from "@/services/feed/add-feed-to-user";
import { addFeedAction } from "./add-feed-action";

vi.mock("@/services/feed/add-feed-to-user");
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
    const mockSubscription = {
      id: "sub-123",
      userId: "user-123",
      feedId: "feed-123",
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(addFeedToUser).mockResolvedValueOnce(mockSubscription as any);

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: true,
      data: mockSubscription,
    });
    expect(addFeedToUser).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "https://example.com/feed.xml",
    );
  });

  it("returns friendly error when FeedNotFoundError is thrown", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(addFeedToUser).mockRejectedValueOnce(new FeedNotFoundError());

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
    vi.mocked(addFeedToUser).mockRejectedValueOnce(new FeedUnavailableError());

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
    vi.mocked(addFeedToUser).mockRejectedValueOnce(
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
    vi.mocked(addFeedToUser).mockRejectedValueOnce(new FeedNetworkError());

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
    vi.mocked(addFeedToUser).mockRejectedValueOnce(new Error("Unexpected"));

    const result = await addFeedAction({ url: "https://example.com/feed.xml" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  });
});
