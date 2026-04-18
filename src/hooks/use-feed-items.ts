import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import type { FeedItemWithSource } from "@/types";
import { useFeedFilter } from "./use-feed-filter";

export function useFeedItems() {
  const { feedId } = useFeedFilter();

  return useSuspenseInfiniteQuery<FeedItemWithSource[]>({
    queryKey: ["feeds", "items", { feedId }],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      let url = `/api/feeds/items?offset=${offset}&limit=${PAGINATION_LIMIT}`;

      if (feedId) {
        url += `&feedId=${feedId}`;
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
      return allPages.flat().length;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
