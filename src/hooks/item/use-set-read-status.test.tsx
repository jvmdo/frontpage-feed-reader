/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setReadStatusAction } from "@/actions/item/set-read-status-action";
import { useSetReadStatus } from "@/hooks/item/use-set-read-status";
import { renderHook, waitFor } from "@/tests/rtl-utils";

vi.mock("@/actions/item/set-read-status-action");

const FEED_ID = 1;
const CATEGORY_ID = 10;
const ITEM_ID = 100;

const ITEMS_KEY = ["feeds", "items", { feedId: null, categoryId: null }];
const COUNTS_KEY = ["feeds", "unread-counts"];
const SUBS_KEY = ["subscriptions"];

function makeItem(
  overrides?: Partial<{ id: number; feedId: number; isRead: boolean }>,
) {
  const { id = ITEM_ID, feedId = FEED_ID, isRead = false } = overrides ?? {};
  return { item: { id }, feed: { id: feedId }, isRead };
}

function makePagedCache(items: ReturnType<typeof makeItem>[]) {
  return { pages: [items], pageParams: [0] };
}

function makeCounts(global = 10, feedCount = 5, catCount = 8) {
  return {
    global,
    categories: { [CATEGORY_ID]: catCount },
    feeds: { [FEED_ID]: feedCount },
  };
}

function makeSubscriptions() {
  return [
    {
      feed: { id: FEED_ID },
      subscription: { categoryId: CATEGORY_ID },
    },
  ];
}

describe("useSetReadStatus", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 1000 * 60 },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(SUBS_KEY, makeSubscriptions());
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  function seedCache({
    isRead = false,
    global = 10,
    feedCount = 5,
    catCount = 8,
  }: {
    isRead?: boolean;
    global?: number;
    feedCount?: number;
    catCount?: number;
  } = {}) {
    queryClient.setQueryData(
      COUNTS_KEY,
      makeCounts(global, feedCount, catCount),
    );
    queryClient.setQueryData(ITEMS_KEY, makePagedCache([makeItem({ isRead })]));
  }

  function getCountsData() {
    return queryClient.getQueryData<any>(COUNTS_KEY);
  }

  function getItemsData(key: any[] = ITEMS_KEY) {
    return queryClient.getQueryData<any>(key);
  }

  describe("optimistic updates", () => {
    beforeEach(() => {
      // Never resolves — isolates optimistic phase
      vi.mocked(setReadStatusAction).mockImplementation(
        () => new Promise(() => {}),
      );
    });

    it("marks the item as read in the paginated cache", async () => {
      seedCache({ isRead: false });
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => {
        expect(getItemsData()?.pages[0][0].isRead).toBe(true);
      });
    });

    it("decrements global, feed, and category unread counts for an unread item", async () => {
      seedCache({ isRead: false, global: 10, feedCount: 5, catCount: 8 });
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => {
        const counts = getCountsData();
        expect(counts?.global).toBe(9);
        expect(counts?.feeds[FEED_ID]).toBe(4);
        expect(counts?.categories[CATEGORY_ID]).toBe(7);
      });
    });

    it("does not decrement counts when item is already read", async () => {
      seedCache({ isRead: true, global: 10, feedCount: 5, catCount: 8 });
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => {
        expect(getItemsData()?.pages[0][0].isRead).toBe(true);
      });

      const counts = getCountsData();
      expect(counts?.global).toBe(10);
      expect(counts?.feeds[FEED_ID]).toBe(5);
    });

    it("marks the item as unread in the paginated cache", async () => {
      seedCache({ isRead: true });
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: false });

      await waitFor(() => {
        expect(getItemsData()?.pages[0][0].isRead).toBe(false);
      });
    });

    it("increments global, feed, and category unread counts when marking unread", async () => {
      seedCache({ isRead: true, global: 10, feedCount: 5, catCount: 8 });
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: false });

      await waitFor(() => {
        const counts = getCountsData();
        expect(counts?.global).toBe(11);
        expect(counts?.feeds[FEED_ID]).toBe(6);
        expect(counts?.categories[CATEGORY_ID]).toBe(9);
      });
    });

    it("still decrements global and feed counts when subscriptions are missing from cache", async () => {
      // Remove subscriptions from cache
      queryClient.removeQueries({ queryKey: SUBS_KEY });
      seedCache({ isRead: false, global: 10, feedCount: 5, catCount: 8 });

      const { result } = renderHook(() => useSetReadStatus(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => {
        const counts = getCountsData();
        expect(counts?.global).toBe(9);
        expect(counts?.feeds[FEED_ID]).toBe(4);
        // Category count remains unchanged as we don't know which category the feed belongs to
        expect(counts?.categories[CATEGORY_ID]).toBe(8);
      });
    });
  });

  describe("on success", () => {
    it("invalidates items and unread-counts queries", async () => {
      seedCache();
      vi.mocked(setReadStatusAction).mockResolvedValue({
        success: true,
        data: {
          itemId: ITEM_ID,
          userId: "u1",
          readAt: new Date(),
          bookmarkedAt: null,
        } as any,
      });

      const invalidate = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useSetReadStatus(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidate).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: COUNTS_KEY }),
      );
      expect(invalidate).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["feeds", "items"] }),
      );
    });
  });

  describe("on error", () => {
    it("rolls back items and counts cache", async () => {
      seedCache({ isRead: false, global: 10 });
      vi.mocked(setReadStatusAction).mockResolvedValue({
        success: false,
        error: "Server error",
        code: "ERROR",
      });

      const { result } = renderHook(() => useSetReadStatus(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(getItemsData()?.pages[0][0].isRead).toBe(false);
      expect(getCountsData()?.global).toBe(10);
    });
  });

  describe("single-item cache shape", () => {
    it("marks a single cached item as read", async () => {
      const singleKey = ["feeds", "items", { itemId: ITEM_ID }];
      queryClient.setQueryData(singleKey, makeItem({ isRead: false }));
      vi.mocked(setReadStatusAction).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useSetReadStatus(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID, isRead: true });

      await waitFor(() => {
        expect(getItemsData(singleKey)?.isRead).toBe(true);
      });
    });
  });
});
