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
      success: false,
      error: expect.any(String),
      code: "VALIDATION_ERROR",
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

    const req = new Request(
      "http://localhost/api/feeds/verify?url=https://example.com/feed.xml",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");

    const json = await res.json();
    expect(json).toEqual({
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
        error: new FeedNotFoundError().message,
        code: "FEED_NOT_FOUND",
        status: 404,
      },
      {
        exception: new FeedUnavailableError(),
        error: new FeedUnavailableError().message,
        code: "FEED_UNAVAILABLE",
        status: 503,
      },
      {
        exception: new FeedNetworkError(),
        error: new FeedNetworkError().message,
        code: "FEED_NETWORK_ERROR",
        status: 502,
      },
      {
        exception: new FeedInvalidFormatError(),
        error: new FeedInvalidFormatError().message,
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
          success: false,
          error,
          code,
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
        success: false,
        error: "An unexpected error occurred. Please try again later.",
        code: "INTERNAL_ERROR",
      });
    });
  });
});
