import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { settings } from "@/env";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useViewOptions } from "@/hooks/ui/use-view-options";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import { getDefaultSorting } from "@/lib/sorting";
import type { ListItemWithSource } from "@/types";

export function useItems() {
  const { feedId, categoryId, isSaved, unreadOnly, feedIds } = useFeedFilter();
  const { sortBy: urlSortBy, sortOrder: urlSortOrder } = useViewOptions();

  const defaultSort = getDefaultSorting({ isSaved });
  const sortOrder = urlSortOrder ?? defaultSort.sortOrder;
  const sortBy = urlSortBy ?? defaultSort.sortBy;

  return useSuspenseInfiniteQuery<
    ListItemWithSource[],
    Error,
    ListItemWithSource[]
  >({
    queryKey: [
      "feeds",
      "items",
      {
        feedId: feedId ?? null,
        categoryId: categoryId ?? null,
        bookmarkedOnly: isSaved,
        unreadOnly,
        feedIds: [...feedIds].sort(),
        sortBy,
        sortOrder,
      },
    ],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const baseUrl = typeof window !== "undefined" ? "" : settings.baseUrl;
      let url = `${baseUrl}/api/items?offset=${offset}&limit=${PAGINATION_LIMIT}`;

      if (feedId) {
        url += `&feedId=${feedId}`;
      }

      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      if (isSaved) {
        url += "&saved=true";
      }

      if (unreadOnly) {
        url += "&unreadOnly=true";
      }

      if (feedIds.length > 0) {
        url += `&feedIds=${feedIds.join(",")}`;
      }

      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch feed items");
      }

      return response.json();
    },
    initialPageParam: PAGINATION_INITIAL_OFFSET,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGINATION_LIMIT) {
        return undefined;
      }
      // Calculate total items fetched so far
      return allPages.reduce((total, page) => total + page.length, 0);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.pages.flat(),
  });
}
