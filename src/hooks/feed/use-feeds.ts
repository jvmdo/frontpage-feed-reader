import { useSuspenseQuery } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/utils";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for fetching and managing user feeds (subscriptions).
 * Uses TanStack Query with server-side prefetch and hydration support.
 */
export function useFeeds() {
  return useSuspenseQuery<FeedWithSubscription[]>({
    queryKey: ["subscriptions"],
    queryFn: async ({ signal }) => {
      const response = await fetch(getAbsoluteUrl("/api/feeds/subscriptions"), {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feeds");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch feeds");
      }

      return result.data as FeedWithSubscription[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
