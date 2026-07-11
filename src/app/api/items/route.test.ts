import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { getItems } from "@/services/item/get-items";
import {
  createMockListItemWithSource,
  createMockUser,
} from "@/tests/factories";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/item/get-items");

describe("GET /api/items", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns unauthorized error (401) if session is missing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/items");
    const res = await GET(req);

    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({ error: "You must be signed in to fetch items." });
  });

  it("returns validation error (400) if search query is too short", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    const req = new NextRequest("http://localhost/api/items?search=a");
    const res = await GET(req);

    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({
      error: "Too small: expected string to have >=2 characters",
    });
  });

  it("returns items matching search criteria when input validation succeeds", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    const mockListItem = createMockListItemWithSource();
    const mockItems = {
      items: [mockListItem],
      nextOffset: 10,
    };

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getItems).mockResolvedValueOnce(mockItems as any);

    const req = new NextRequest(
      "http://localhost/api/items?search=coding&feedId=5&saved=true&feedIds=10,20&status=unread&sortBy=publishedAt&sortOrder=desc",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(mockItems)));

    expect(getItems).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      expect.objectContaining({
        search: "coding",
        feedId: 5,
        bookmarkedOnly: true,
        status: "unread",
        feedIds: [10, 20],
        sortBy: "publishedAt",
        sortOrder: "desc",
      }),
    );
  });

  it("returns 500 error if getItems service fails", async () => {
    const mockUser = createMockUser({ id: "user-123" });
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);
    vi.mocked(getItems).mockRejectedValueOnce(new Error("Query failed"));

    const req = new NextRequest("http://localhost/api/items");
    const res = await GET(req);

    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual({ error: "Failed to fetch feed items" });
  });
});
