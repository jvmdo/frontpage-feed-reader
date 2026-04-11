import { useQuery } from "@tanstack/react-query";
import type { FeedItemWithSource } from "@/types";

export function useFeedItems() {
  return useQuery<FeedItemWithSource[]>({
    queryKey: ["feeds", "items"],
    queryFn: async () => {
      const response = await fetch("/api/feeds/items");
      if (!response.ok) {
        throw new Error("Failed to fetch feed items");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
