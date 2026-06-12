import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeFeedAction } from "@/actions/feed/remove-feed-action";
import type { GenericCacheData } from "@/hooks/item/cache";
import { filterFromCache } from "@/hooks/item/cache";
import type { RemoveFeedInput } from "@/lib/validations/feed";
import type {
  FeedWithSubscription,
  ItemWithSource,
  ListItemWithSource,
} from "@/types";

type ItemCacheData = GenericCacheData<ListItemWithSource, ItemWithSource>;

/**
 * Custom hook for removing a feed subscription.
 * Uses TanStack Query mutation to wrap the server action and manually update the cache.
 */
export function useRemoveFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveFeedInput) => {
      const response = await removeFeedAction(input);

      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (deletedSubscription) => {
      if (!deletedSubscription) return;

      // 1. Manually update the 'subscriptions' cache by filtering out the removed item.
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;

          return old.filter(
            (item) => item.subscription.id !== deletedSubscription.id,
          );
        },
      );

      // 2. Manually update the 'items' cache to remove all articles from this deleted feed.
      queryClient.setQueriesData<ItemCacheData>(
        { queryKey: ["feeds", "items"] },
        (old) =>
          filterFromCache(
            old,
            (item) => item.feed.id === deletedSubscription.feedId,
          ),
      );

      // 3. Invalidate specific dependent queries to sync with the server truth.
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
