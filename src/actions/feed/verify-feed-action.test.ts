/** biome-ignore-all lint/suspicious/noExplicitAny: testing asset */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { parseFeedXml } from "@/lib/feed/parser";
import { getCurrentSession } from "@/lib/session";
import { fetchFeedXml } from "@/services/ingestion/fetch-feed-xml";
import { createMockFeed, createMockUser } from "@/tests/factories";
import { verifyFeedAction } from "./verify-feed-action";

vi.mock("@/db", () => ({
  db: {
    query: {
      feeds: {
        findFirst: vi.fn(),
      },
      subscriptions: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/services/ingestion/fetch-feed-xml");
vi.mock("@/lib/feed/parser");
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

  it("returns alreadySubscribed: true if feed exists in DB and user is subscribed", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockFeed = createMockFeed({
      id: 123,
      title: "Existing Feed",
      description: "Desc",
      iconUrl: "https://example.com/icon.png",
    });

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(db.query.feeds.findFirst as any).mockResolvedValueOnce(mockFeed);
    vi.mocked(db.query.subscriptions.findFirst as any).mockResolvedValueOnce({
      id: 789,
      userId: mockUser.id,
      feedId: mockFeed.id,
    });

    const result = await verifyFeedAction({
      url: "https://example.com/feed.xml",
    });

    expect(result).toEqual({
      success: true,
      alreadySubscribed: true,
      feed: {
        title: "Existing Feed",
        description: "Desc",
        iconUrl: "https://example.com/icon.png",
      },
    });
    expect(fetchFeedXml).not.toHaveBeenCalled();
  });

  it("returns alreadySubscribed: false if feed exists in DB but user is NOT subscribed", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockFeed = createMockFeed({
      id: 123,
      title: "Existing Feed",
      description: "Desc",
      iconUrl: "https://example.com/icon.png",
    });

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(db.query.feeds.findFirst as any).mockResolvedValueOnce(mockFeed);
    vi.mocked(db.query.subscriptions.findFirst as any).mockResolvedValueOnce(
      null,
    );

    const result = await verifyFeedAction({
      url: "https://example.com/feed.xml",
    });

    expect(result).toEqual({
      success: true,
      alreadySubscribed: false,
      feed: {
        title: "Existing Feed",
        description: "Desc",
        iconUrl: "https://example.com/icon.png",
      },
    });
    expect(fetchFeedXml).not.toHaveBeenCalled();
  });

  it("fetches, parses, and returns metadata if feed is NOT in DB", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(db.query.feeds.findFirst as any).mockResolvedValueOnce(null);

    vi.mocked(fetchFeedXml).mockResolvedValueOnce({
      status: "success",
      xml: "<xml></xml>",
      etag: null,
      lastModified: null,
    });

    vi.mocked(parseFeedXml).mockResolvedValueOnce({
      metadata: {
        title: "Fetched Feed",
        description: "Fetched Description",
        iconUrl: "https://example.com/fetched-icon.png",
      },
      items: [],
    });

    const result = await verifyFeedAction({
      url: "https://example.com/feed.xml",
    });

    expect(result).toEqual({
      success: true,
      alreadySubscribed: false,
      feed: {
        title: "Fetched Feed",
        description: "Fetched Description",
        iconUrl: "https://example.com/fetched-icon.png",
      },
    });
    expect(fetchFeedXml).toHaveBeenCalledWith("https://example.com/feed.xml");
    expect(parseFeedXml).toHaveBeenCalledWith(
      "<xml></xml>",
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
        vi.mocked(db.query.feeds.findFirst as any).mockResolvedValueOnce(null);
        vi.mocked(fetchFeedXml).mockRejectedValueOnce(exception);

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
  });
});
