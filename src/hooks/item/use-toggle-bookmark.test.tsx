import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toggleBookmarkAction } from "@/actions/item/toggle-bookmark-action";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { renderHook, waitFor } from "@/tests/rtl-utils";

vi.mock("@/actions/item/toggle-bookmark-action");

const FEED_ID = 1;
const ITEM_ID = 100;

const ITEMS_KEY = [
  "feeds",
  "items",
  { feedId: null, categoryId: null, bookmarkedOnly: false },
];
const COUNTS_KEY = ["feeds", "unread-counts"];

function makeItem(
  overrides?: Partial<{
    id: number;
    feedId: number;
    isRead: boolean;
    isBookmarked: boolean;
  }>,
) {
  const {
    id = ITEM_ID,
    feedId = FEED_ID,
    isRead = false,
    isBookmarked = false,
  } = overrides ?? {};
  return { item: { id }, feed: { id: feedId }, isRead, isBookmarked };
}

function makePagedCache(items: ReturnType<typeof makeItem>[]) {
  return { pages: [items], pageParams: [0] };
}

function makeCounts(saved = 5) {
  return {
    global: 10,
    categories: {},
    feeds: { [FEED_ID]: 5 },
    saved,
  };
}

describe("useToggleBookmark", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 1000 * 60 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  function seedCache({
    isBookmarked = false,
    isRead = false,
    savedCount = 5,
  }: {
    isBookmarked?: boolean;
    isRead?: boolean;
    savedCount?: number;
  } = {}) {
    queryClient.setQueryData(COUNTS_KEY, makeCounts(savedCount));
    queryClient.setQueryData(
      ITEMS_KEY,
      makePagedCache([makeItem({ isBookmarked, isRead })]),
    );
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
      vi.mocked(toggleBookmarkAction).mockImplementation(
        () => new Promise(() => {}),
      );
    });

    it("toggles bookmark status in the paginated cache", async () => {
      seedCache({ isBookmarked: false });
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        expect(getItemsData()?.pages[0][0].isBookmarked).toBe(true);
      });
    });

    it("toggles bookmark status in the search results cache", async () => {
      const searchKey = ["feeds", "items", "search", "react"];
      queryClient.setQueryData(
        searchKey,
        makePagedCache([makeItem({ isBookmarked: false })]),
      );
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        expect(getItemsData(searchKey)?.pages[0][0].isBookmarked).toBe(true);
      });
    });

    it("optimistically injects newly bookmarked item into the Saved view cache", async () => {
      const item = makeItem({ id: ITEM_ID, isBookmarked: false });
      queryClient.setQueryData(ITEMS_KEY, makePagedCache([item]));

      const savedKey = [
        "feeds",
        "items",
        { feedId: null, categoryId: null, bookmarkedOnly: true },
      ];
      queryClient.setQueryData(savedKey, makePagedCache([]));

      const { result } = renderHook(() => useToggleBookmark(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        const savedData = getItemsData(savedKey);
        expect(savedData?.pages[0]).toHaveLength(1);
        expect(savedData?.pages[0][0].item.id).toBe(ITEM_ID);
        expect(savedData?.pages[0][0].isBookmarked).toBe(true);
      });
    });

    it("optimistically removes unbookmarked item from the Saved view cache", async () => {
      const item = makeItem({ id: ITEM_ID, isBookmarked: true });
      const savedKey = [
        "feeds",
        "items",
        { feedId: null, categoryId: null, bookmarkedOnly: true },
      ];
      queryClient.setQueryData(savedKey, makePagedCache([item]));
      queryClient.setQueryData(ITEMS_KEY, makePagedCache([item]));

      const { result } = renderHook(() => useToggleBookmark(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        const savedData = getItemsData(savedKey);
        expect(savedData?.pages[0]).toHaveLength(0);
      });
    });

    it("increments saved unread count when bookmarking an unread item", async () => {
      seedCache({ isBookmarked: false, isRead: false, savedCount: 5 });
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        expect(getCountsData()?.saved).toBe(6);
      });
    });

    it("decrements saved unread count when removing bookmark from an unread item", async () => {
      seedCache({ isBookmarked: true, isRead: false, savedCount: 5 });
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        expect(getCountsData()?.saved).toBe(4);
      });
    });

    it("does not change saved count when toggling a read item", async () => {
      seedCache({ isBookmarked: false, isRead: true, savedCount: 5 });
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => {
        expect(getItemsData()?.pages[0][0].isBookmarked).toBe(true);
      });

      expect(getCountsData()?.saved).toBe(5);
    });
  });

  describe("on error", () => {
    it("rolls back item state and saved count", async () => {
      seedCache({ isBookmarked: false, isRead: false, savedCount: 5 });
      vi.mocked(toggleBookmarkAction).mockResolvedValue({
        success: false,
        error: "Server error",
        code: "ERROR",
      });

      const { result } = renderHook(() => useToggleBookmark(), { wrapper });
      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(getItemsData()?.pages[0][0].isBookmarked).toBe(false);
      expect(getCountsData()?.saved).toBe(5);
    });
  });

  describe("on settlement", () => {
    it("invalidates relevant queries", async () => {
      seedCache();
      vi.mocked(toggleBookmarkAction).mockResolvedValue({
        success: true,
        data: { itemId: ITEM_ID, bookmarkedAt: new Date() } as any,
      });

      const invalidate = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ itemId: ITEM_ID });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidate).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: COUNTS_KEY }),
      );
      expect(invalidate).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["feeds", "items"] }),
      );
    });
  });
});
