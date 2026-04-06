import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeSubscriptionAction } from "@/actions/feed";
import type { RemoveSubscriptionInput } from "@/lib/validations/feed";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for removing a feed subscription.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useRemoveSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveSubscriptionInput) => {
      const response = await removeSubscriptionAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (deletedSubscription) => {
      if (!deletedSubscription) return;

      // Manually update the 'subscriptions' cache by filtering out the removed item.
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;

          return old.filter(
            (item) => item.subscription.id !== deletedSubscription.id,
          );
        },
      );

      // Also invalidate both subscriptions and feeds queries.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
