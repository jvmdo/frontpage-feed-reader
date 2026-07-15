import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFeedAction } from "@/actions/feed/update-feed-action";
import { queryKeys } from "@/lib/query-keys";
import type { UpdateFeedInput } from "@/lib/validations/feed";

/**
 * Custom hook for updating a feed subscription.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useUpdateFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFeedInput) => {
      const response = await updateFeedAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      // Invalidate subscriptions and dependent feed/item queries.
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    },
  });
}
