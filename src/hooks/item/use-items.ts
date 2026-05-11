import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import type { ListItemWithSource } from "@/types";

export function useItems() {
  const { feedId, categoryId } = useFeedFilter();

  return useSuspenseInfiniteQuery<ListItemWithSource[]>({
    queryKey: ["feeds", "items", { feedId, categoryId }],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      let url = `/api/items?offset=${offset}&limit=${PAGINATION_LIMIT}`;

      if (feedId) {
        url += `&feedId=${feedId}`;
      }

      if (categoryId) {
        url += `&categoryId=${categoryId}`;
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
