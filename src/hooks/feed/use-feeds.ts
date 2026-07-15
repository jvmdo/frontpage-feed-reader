import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAbsoluteUrl } from "@/lib/utils";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for fetching and managing user feeds (subscriptions).
 * Uses TanStack Query with server-side prefetch and hydration support.
 */
export function useFeeds() {
  return useSuspenseQuery<FeedWithSubscription[]>({
    queryKey: queryKeys.subscriptions.all,
    queryFn: async ({ signal }) => {
      const response = await fetch(getAbsoluteUrl("/api/feeds/subscriptions"), {
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch feeds");
      }

      return response.json();
    },
  });
}
