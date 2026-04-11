import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedItemWithSource } from "@/types";

export function useFeedItems() {
  return useInfiniteQuery<FeedItemWithSource[]>({
    queryKey: ["feeds", "items"],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const response = await fetch(`/api/feeds/items?offset=${offset}&limit=20`);
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
