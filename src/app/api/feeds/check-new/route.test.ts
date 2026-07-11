import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { countNewItems } from "@/services/item/count-new-items";
import { createMockUser } from "@/tests/factories";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/item/count-new-items");

describe("GET /api/feeds/check-new", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns validation error (400) if input is invalid", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: createMockUser({ id: "user-123" }),
    } as any);

    const req = new Request(
      "http://localhost/api/feeds/check-new?since=not-a-date",
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
      "http://localhost/api/feeds/check-new?since=2026-07-10T12:00:00Z",
    );
    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({
      success: false,
      error: "You must be signed in to check for new items.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and the count when check is successful", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const since = "2026-07-10T12:00:00.000Z";

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(countNewItems).mockResolvedValueOnce(5);

    const req = new Request(
      `http://localhost/api/feeds/check-new?since=${since}&feedId=10`,
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      data: { count: 5 },
    });

    expect(countNewItems).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      expect.objectContaining({
        since: new Date(since),
        feedId: 10,
      }),
    );
  });

  it("successfully parses and validates comma-separated feedIds", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const since = "2026-07-10T12:00:00.000Z";

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(countNewItems).mockResolvedValueOnce(3);

    const req = new Request(
      `http://localhost/api/feeds/check-new?since=${since}&feedIds=10,20`,
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      data: { count: 3 },
    });

    expect(countNewItems).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      expect.objectContaining({
        since: new Date(since),
        feedIds: [10, 20],
      }),
    );
  });

  it("returns internal error (500) on unexpected service errors", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(countNewItems).mockRejectedValueOnce(new Error("Query failed"));

    const req = new Request(
      "http://localhost/api/feeds/check-new?since=2026-07-10T12:00:00.000Z",
    );
    const res = await GET(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual({
      success: false,
      error: "An unexpected error occurred while checking for new items.",
      code: "INTERNAL_ERROR",
    });
  });
});
