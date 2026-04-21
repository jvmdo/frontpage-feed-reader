import { describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { getUnreadCounts } from "@/services/feed/get-unread-counts";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/feed/get-unread-counts");

describe("GET /api/feeds/unread-counts", () => {
  it("returns 401 if unauthorized", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("returns unread counts if authorized", async ({}) => {
    const mockSession = { user: { id: "user-123" } };
    const mockCounts = { global: 5 };

    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getUnreadCounts).mockResolvedValueOnce(mockCounts as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: mockCounts,
    });
    expect(getUnreadCounts).toHaveBeenCalledWith(expect.anything(), "user-123");
  });

  it("returns 500 if service fails", async () => {
    const mockSession = { user: { id: "user-123" } };
    vi.mocked(getCurrentSession).mockResolvedValueOnce(mockSession as any);
    vi.mocked(getUnreadCounts).mockRejectedValueOnce(new Error("Service error"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "Failed to fetch unread counts",
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
