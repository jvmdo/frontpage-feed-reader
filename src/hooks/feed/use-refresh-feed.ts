import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshFeedAction } from "@/actions/feed/refresh-feed-action";
import { queryKeys } from "@/lib/query-keys";
import type { RefreshFeedInput } from "@/lib/validations/feed";

/**
 * Custom hook for refreshing a feed.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useRefreshFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RefreshFeedInput) => {
      const response = await refreshFeedAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure consistent state across other queries.
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    },
  });
}
