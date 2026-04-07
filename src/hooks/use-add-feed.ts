import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFeedAction } from "@/actions/feed";
import type { AddFeedInput } from "@/lib/validations/feed";
import type { FeedWithSubscription } from "@/types";

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

      return response.data as FeedWithSubscription;
    },
    onSuccess: (newSubscription) => {
      // Manually update the 'subscriptions' cache by adding the new item.
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return [newSubscription];

          // Avoid duplicates just in case
          if (old.some((s) => s.subscription.id === newSubscription.subscription.id)) {
            return old;
          }

          return [...old, newSubscription];
        },
      );

      // Invalidate relevant queries when a feed is added.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
