import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItemWithSource } from "@/types";
import { useFeedFilter } from "./use-feed-filter";

export function useFeedItems() {
  const { feedId } = useFeedFilter();

  return useInfiniteQuery<FeedItemWithSource[]>({
    queryKey: ["feeds", "items", { feedId }],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      let url = `/api/feeds/items?offset=${offset}&limit=20`;
      if (feedId) {
        url += `&feedId=${feedId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch feed items");
      }
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return allPages.length * 20;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
