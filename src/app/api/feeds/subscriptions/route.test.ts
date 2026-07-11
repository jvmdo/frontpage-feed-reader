import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { getSubscriptions } from "@/services/subscription/get-subscriptions";
import {
  createMockFeedWithSubscription,
  createMockUser,
} from "@/tests/factories";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/subscription/get-subscriptions");

describe("GET /api/feeds/subscriptions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns unauthorized error (401) if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({
      success: false,
      error: "You must be signed in to fetch subscriptions.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns success and list of subscriptions when query succeeds", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockSubscriptions = [
      createMockFeedWithSubscription(),
      createMockFeedWithSubscription(),
    ];

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getSubscriptions).mockResolvedValueOnce(mockSubscriptions as any);

    const res = await GET();

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      data: JSON.parse(JSON.stringify(mockSubscriptions)),
    });

    expect(getSubscriptions).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
    );
  });

  it("returns internal server error (500) if getSubscriptions fails", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getSubscriptions).mockRejectedValueOnce(
      new Error("Query failed"),
    );

    const res = await GET();
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual({
      success: false,
      error: "Failed to fetch subscriptions",
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
