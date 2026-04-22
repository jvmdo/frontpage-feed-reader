import { describe, expect, it, vi } from "vitest";
import { getCurrentSession } from "@/lib/session";
import { getFeedItem } from "@/services/feed/get-feed-item";
import { GET } from "./route";

vi.mock("@/lib/session");
vi.mock("@/services/feed/get-feed-item");

describe("GET /api/feeds/items/[id]", () => {
  it("returns 401 if unauthorized", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/feeds/items/123");
    const response = await GET(request as any, { params: Promise.resolve({ id: "123" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 if ID is not a number", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: "user-1" } } as any);

    const request = new Request("http://localhost/api/feeds/items/abc");
    const response = await GET(request as any, { params: Promise.resolve({ id: "abc" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid item ID");
  });

  it("returns 404 if item not found or unsubscribed", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: "user-1" } } as any);
    vi.mocked(getFeedItem).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/feeds/items/123");
    const response = await GET(request as any, { params: Promise.resolve({ id: "123" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Item not found");
  });

  it("returns 200 and item if found", async () => {
    const mockItem = { item: { id: 123, title: "Title" }, feed: {}, isRead: false };
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: "user-1" } } as any);
    vi.mocked(getFeedItem).mockResolvedValueOnce(mockItem as any);

    const request = new Request("http://localhost/api/feeds/items/123");
    const response = await GET(request as any, { params: Promise.resolve({ id: "123" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockItem);
    expect(getFeedItem).toHaveBeenCalledWith(expect.anything(), "user-1", 123);
  });

  it("returns 500 if service throws", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({ user: { id: "user-1" } } as any);
    vi.mocked(getFeedItem).mockRejectedValueOnce(new Error("DB error"));

    const request = new Request("http://localhost/api/feeds/items/123");
    const response = await GET(request as any, { params: Promise.resolve({ id: "123" }) });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch feed item");
  });
});
