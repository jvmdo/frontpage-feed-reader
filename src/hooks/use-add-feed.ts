import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFeedAction } from "@/actions/feed";
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

      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries when a feed is added.
      // We'll use a broad 'subscriptions' key for now.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
}
