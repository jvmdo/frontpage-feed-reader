import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshFeedAction } from "@/actions/feed/refresh-feed-action";
import type { RefreshFeedInput } from "@/lib/validations/feed";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for refreshing a feed.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useRefreshFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RefreshFeedInput) => {
      const response = await refreshFeedAction(input);

      if (!response.success && !response.data) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (updatedData) => {
      if (!updatedData) return;

      // Manually update the 'subscriptions' cache with the refreshed feed and subscription data.
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;

          return old.map((item): FeedWithSubscription => {
            if (item.subscription.id === updatedData.subscription.id) {
              return updatedData;
            }
            return item;
          });
        },
      );

      // Invalidate to ensure consistent state across other potential queries.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
