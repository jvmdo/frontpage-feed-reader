import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFeedAction } from "@/actions/feed/update-feed-action";
import { queryKeys } from "@/lib/query-keys";
import type { UpdateFeedInput } from "@/lib/validations/feed";

/**
 * Custom hook for updating a feed subscription.
 * Uses TanStack Query mutation to wrap the server action and awaits cache invalidation.
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
    onSuccess: async () => {
      // 1. Await the heavy query first
      // By delaying the `subscriptions` cache update, we prevent the component that triggered
      // the mutation from re-rendering and (unmounting children) prematurely.
      // This ensures its local `isPending` state remains `true` and the UI continues
      // to show a loading spinner until the heavy background fetch is completely finished.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.feeds.items.all(),
      });

      // 2. Once the heavy lifting is done, invalidate the fast queries.
      // This updates the cache for `subscriptions`, instantly triggering dialog UI changes
      // (moving the feed to the new category list) only AFTER we know the background
      // items list is fully synced and ready to be viewed.
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.unreadCounts.all,
        }),
      ]);
    },
  });
}
