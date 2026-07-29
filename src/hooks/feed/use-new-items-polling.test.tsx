import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useNewItemsPolling } from "@/hooks/feed/use-new-items-polling";
import { useItems } from "@/hooks/item/use-items";
import { useViewOptions } from "@/hooks/ui/use-view-options";
import { server } from "@/tests/mocks/server";
import { act, renderHook, waitFor } from "@/tests/rtl-utils";

vi.mock("@/hooks/feed/use-feed-filter", () => ({
  useFeedFilter: vi.fn(() => ({
    feedId: null,
    categoryId: null,
    isSaved: false,
    status: "all",
    feedIds: [],
  })),
}));

vi.mock("@/hooks/ui/use-view-options", () => ({
  useViewOptions: vi.fn(() => ({
    sortBy: "publishedAt",
    sortOrder: "desc",
  })),
}));

vi.mock("@/hooks/ui/use-tour-store", () => ({
  useTourStore: vi.fn(() => ({
    isTourActive: false,
  })),
}));

vi.mock("@/hooks/item/use-items", () => ({
  useItems: vi.fn(),
}));

describe("useNewItemsPolling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFeedFilter).mockReturnValue({
      feedId: null,
      categoryId: null,
      isSaved: false,
      status: "all",
      feedIds: [],
    } as any);
    vi.mocked(useViewOptions).mockReturnValue({
      sortBy: "publishedAt",
      sortOrder: "desc",
    } as any);
  });

  it("returns count from check-new API when polling succeeds", async () => {
    const T1 = new Date("2026-07-17T22:00:00.000Z");

    server.use(
      http.get("/api/feeds/check-new", () => {
        return HttpResponse.json({ count: 5 });
      }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: T1.toISOString() } }],
    } as any);

    const { result } = renderHook(() => useNewItemsPolling());

    await waitFor(() => expect(result.current.newItemsCount).toBe(5));
  });

  it("resets count to 0 when items are refetched (latestItemDate advances)", async () => {
    const T1 = new Date("2026-07-17T22:00:00.000Z");
    const T2 = new Date("2026-07-17T23:00:00.000Z");

    server.use(
      http.get("/api/feeds/check-new", ({ request }) => {
        const since = new URL(request.url).searchParams.get("since");
        if (since === T1.toISOString()) {
          return HttpResponse.json({ count: 3 });
        }
        return HttpResponse.json({ count: 0 });
      }),
    );

    // Initial item date is T1
    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: T1.toISOString() } }],
    } as any);

    const { result, rerender } = renderHook(() => useNewItemsPolling());

    // Wait for the initial poll to load the count
    await waitFor(() => expect(result.current.newItemsCount).toBe(3));

    // Simulate item list refetch/advancement by changing hook's return value to T2
    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: T2.toISOString() } }],
    } as any);

    rerender();

    // The query key should change (since T1 to T2), resolving to the new count (0)
    await waitFor(() => expect(result.current.newItemsCount).toBe(0));
  });

  it("sets count to 0 immediately when handleLoadNew is called", async () => {
    const T1 = new Date("2026-07-17T22:00:00.000Z");

    server.use(
      http.get("/api/feeds/check-new", () => {
        return HttpResponse.json({ count: 4 });
      }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: T1.toISOString() } }],
    } as any);

    const { result } = renderHook(() => useNewItemsPolling());

    await waitFor(() => expect(result.current.newItemsCount).toBe(4));

    // Calling handleLoadNew sets query data to 0
    act(() => {
      result.current.handleLoadNew();
    });

    await waitFor(() => expect(result.current.newItemsCount).toBe(0));
  });

  it("does not fetch and returns 0 when latestItemDate is undefined (empty list)", async () => {
    let apiCalled = false;
    server.use(
      http.get("/api/feeds/check-new", () => {
        apiCalled = true;
        return HttpResponse.json({ count: 5 });
      }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: [],
    } as any);

    const { result } = renderHook(() => useNewItemsPolling());

    // Should stay 0 because query is disabled when latestItemDate is undefined/null
    expect(result.current.newItemsCount).toBe(0);
    expect(apiCalled).toBe(false);
  });

  it("does not fetch when status is read", async () => {
    vi.mocked(useFeedFilter).mockReturnValue({
      feedId: null,
      categoryId: null,
      isSaved: false,
      status: "read",
      feedIds: [],
    } as any);

    let apiCalled = false;
    server.use(
      http.get("/api/feeds/check-new", () => {
        apiCalled = true;
        return HttpResponse.json({ count: 5 });
      }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: new Date().toISOString() } }],
    } as any);

    const { result } = renderHook(() => useNewItemsPolling());

    expect(result.current.newItemsCount).toBe(0);
    expect(apiCalled).toBe(false);
  });

  it("does not fetch when sort is ascending", async () => {
    vi.mocked(useViewOptions).mockReturnValue({
      sortBy: "publishedAt",
      sortOrder: "asc",
    } as any);

    let apiCalled = false;
    server.use(
      http.get("/api/feeds/check-new", () => {
        apiCalled = true;
        return HttpResponse.json({ count: 5 });
      }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: [{ item: { publishedAt: new Date().toISOString() } }],
    } as any);

    const { result } = renderHook(() => useNewItemsPolling());

    expect(result.current.newItemsCount).toBe(0);
    expect(apiCalled).toBe(false);
  });
});
