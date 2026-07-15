import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAbsoluteUrl } from "@/lib/utils";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";

/**
 * Custom hook for fetching and managing unread counts.
 * Uses TanStack Query for caching and automatic background updates.
 */
export function useUnreadCounts() {
  return useSuspenseQuery<UnreadCounts>({
    queryKey: queryKeys.unreadCounts.all,
    queryFn: async ({ signal }) => {
      const response = await fetch(getAbsoluteUrl("/api/feeds/unread-counts"), {
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch unread counts");
      }

      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
