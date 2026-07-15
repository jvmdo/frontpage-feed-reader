import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFeedAction } from "@/actions/feed/add-feed-action";
import { queryKeys } from "@/lib/query-keys";
import type { AddFeedInput } from "@/lib/validations/feed";

/**
 * Custom hook for adding a feed subscription.
 * Uses TanStack Query mutation to wrap the server action.
 */
export function useAddFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddFeedInput) => {
      const response = await addFeedAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      // Invalidate specific dependent queries to sync with the server truth.
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    },
  });
}
