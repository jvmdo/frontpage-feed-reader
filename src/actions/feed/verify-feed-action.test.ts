/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { getCurrentSession } from "@/lib/session";
import { verifyFeed } from "@/services/feed/verify-feed";
import { createMockUser } from "@/tests/factories";
import { verifyFeedAction } from "./verify-feed-action";

vi.mock("@/services/feed/verify-feed");
vi.mock("@/lib/session");

describe("verifyFeedAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error if input URL is invalid", async () => {
    const result = await verifyFeedAction({ url: "invalid-url" });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
    });
  });

  it("returns unauthorized error if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const result = await verifyFeedAction({
      url: "https://example.com/feed.xml",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to verify a feed.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and verification data when service resolves", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockServiceResult = {
      alreadySubscribed: true,
      feed: {
        title: "Mock Title",
        description: "Mock Description",
        iconUrl: "https://example.com/icon.png",
      },
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(verifyFeed).mockResolvedValueOnce(mockServiceResult);

    const result = await verifyFeedAction({
      url: "https://example.com/feed.xml",
    });

    expect(result).toEqual({
      success: true,
      alreadySubscribed: true,
      feed: {
        title: "Mock Title",
        description: "Mock Description",
        iconUrl: "https://example.com/icon.png",
      },
    });

    expect(verifyFeed).toHaveBeenCalledWith(
      expect.anything(),
      mockUser.id,
      "https://example.com/feed.xml",
    );
  });

  describe("Error handling", () => {
    const errorsMap = [
      {
        exception: new FeedNotFoundError(),
        error: "We couldn't reach this URL. Please double-check for typos.",
        code: "FEED_NOT_FOUND",
      },
      {
        exception: new FeedUnavailableError(),
        error:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        code: "FEED_UNAVAILABLE",
      },
      {
        exception: new FeedNetworkError(),
        error:
          "A network error occurred while reaching the feed. Please try again.",
        code: "FEED_NETWORK_ERROR",
      },
      {
        exception: new FeedInvalidFormatError(),
        error:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        code: "FEED_INVALID_FORMAT",
      },
    ];

    for (const { exception, error, code } of errorsMap) {
      it(`maps ${code} exception to user-friendly verified feed result`, async () => {
        const mockUser = createMockUser({ id: "user-123" });
        vi.mocked(getCurrentSession).mockResolvedValueOnce({
          user: mockUser,
        } as any);
        vi.mocked(verifyFeed).mockRejectedValueOnce(exception);

        const result = await verifyFeedAction({
          url: "https://example.com/feed.xml",
        });

        expect(result).toEqual({
          success: false,
          error,
          code,
        });
      });
    }

    it("returns internal error on unexpected errors", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);
      vi.mocked(verifyFeed).mockRejectedValueOnce(new Error("Unexpected"));

      const result = await verifyFeedAction({
        url: "https://example.com/feed.xml",
      });

      expect(result).toEqual({
        success: false,
        error: "An unexpected error occurred. Please try again later.",
        code: "INTERNAL_ERROR",
      });
    });
  });
});
