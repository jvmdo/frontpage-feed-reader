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
import { GET } from "./route";

vi.mock("@/services/feed/verify-feed");
vi.mock("@/lib/session");

describe("GET /api/feeds/verify", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error (400) if input URL is invalid", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: createMockUser({ id: "user-123" }),
    } as any);

    const req = new Request(
      "http://localhost/api/feeds/verify?url=invalid-url",
    );
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({
      error: expect.any(String),
    });
  });

  it("returns unauthorized error (401) if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const req = new Request(
      "http://localhost/api/feeds/verify?url=https://example.com/feed.xml",
    );
    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({
      error: "You must be signed in to verify a feed.",
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

    const req = new Request(
      "http://localhost/api/feeds/verify?url=https://example.com/feed.xml",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");

    const json = await res.json();
    expect(json).toEqual({
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
        status: 404,
      },
      {
        exception: new FeedUnavailableError(),
        error:
          "The source site is currently slow or unavailable. Try again in a few minutes.",
        code: "FEED_UNAVAILABLE",
        status: 503,
      },
      {
        exception: new FeedNetworkError(),
        error:
          "A network error occurred while reaching the feed. Please try again.",
        code: "FEED_NETWORK_ERROR",
        status: 502,
      },
      {
        exception: new FeedInvalidFormatError(),
        error:
          "This link doesn't seem to be a valid RSS or Atom feed. Make sure you're using the direct feed link.",
        code: "FEED_INVALID_FORMAT",
        status: 422,
      },
    ];

    for (const { exception, error, code, status } of errorsMap) {
      it(`maps ${code} exception to user-friendly status ${status}`, async () => {
        const mockUser = createMockUser({ id: "user-123" });
        vi.mocked(getCurrentSession).mockResolvedValueOnce({
          user: mockUser,
        } as any);
        vi.mocked(verifyFeed).mockRejectedValueOnce(exception);

        const req = new Request(
          "http://localhost/api/feeds/verify?url=https://example.com/feed.xml",
        );
        const res = await GET(req);
        expect(res.status).toBe(status);

        const json = await res.json();
        expect(json).toEqual({
          error,
        });
      });
    }

    it("returns internal error (500) on unexpected errors", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        user: mockUser,
      } as any);
      vi.mocked(verifyFeed).mockRejectedValueOnce(new Error("Unexpected"));

      const req = new Request(
        "http://localhost/api/feeds/verify?url=https://example.com/feed.xml",
      );
      const res = await GET(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json).toEqual({
        error: "An unexpected error occurred. Please try again later.",
      });
    });
  });
});
