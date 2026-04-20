import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSubscriptionAction } from "@/actions/feed/update-subscription-action";
import type { UpdateSubscriptionInput } from "@/lib/validations/feed";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for updating a feed subscription.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSubscriptionInput) => {
      const response = await updateSubscriptionAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (updatedSubscription) => {
      if (!updatedSubscription) return;

      // Manually update the 'subscriptions' cache to reflect the change immediately.
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;

          return old.map((item): FeedWithSubscription => {
            if (item.subscription.id === updatedSubscription.id) {
              return {
                ...item,
                subscription: updatedSubscription,
              };
            }
            return item;
          });
        },
      );

      // Invalidate subscriptions to ensure consistency.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });

      // Invalidate all feed items queries. When a categoryId changes,
      // the existing cached item lists for categories/all-items are no longer valid.
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
