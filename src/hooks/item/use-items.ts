import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import type { ListItemWithSource } from "@/types";

export function useItems() {
  const { feedId, categoryId, isSaved, unreadOnly, feedIds } = useFeedFilter();

  return useSuspenseInfiniteQuery<ListItemWithSource[]>({
    queryKey: [
      "feeds",
      "items",
      {
        feedId: feedId ?? null,
        categoryId: categoryId ?? null,
        bookmarkedOnly: isSaved,
        unreadOnly,
        feedIds: [...feedIds].sort(),
      },
    ],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const baseUrl =
        typeof window !== "undefined"
          ? ""
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
  });
}
