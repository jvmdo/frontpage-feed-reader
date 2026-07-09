import { useSuspenseQuery } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/utils";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";

/**
 * Custom hook for fetching and managing unread counts.
 * Uses TanStack Query for caching and automatic background updates.
 */
export function useUnreadCounts() {
  return useSuspenseQuery<UnreadCounts>({
    queryKey: ["feeds", "unread-counts"],
    queryFn: async ({ signal }) => {
      const response = await fetch(getAbsoluteUrl("/api/feeds/unread-counts"), {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread counts");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch unread counts");
      }

      return result.data as UnreadCounts;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
