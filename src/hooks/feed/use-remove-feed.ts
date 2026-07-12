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
    },
    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["subscriptions"] });
      await queryClient.cancelQueries({ queryKey: ["feeds", "items"] });

      // 2. Snapshot current caches for rollback
      const previousSubscriptions = queryClient.getQueryData<
        FeedWithSubscription[]
      >(["subscriptions"]);
      // Snapshot items cache queries
      const previousQueries = queryClient.getQueriesData<ItemCacheData>({
        queryKey: ["feeds", "items"],
      });

      // Find the associated feedId from the subscriptions cache before we modify it
      const targetSubscription = previousSubscriptions?.find(
        (s) => s.subscription.id === variables.id,
      );
      const feedId = targetSubscription?.feed.id;

      // 3. Optimistically remove subscription from cache
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;
          return old.filter((item) => item.subscription.id !== variables.id);
        },
      );

      // 4. Optimistically filter out items belonging to the removed feed
      if (feedId) {
        queryClient.setQueriesData<ItemCacheData>(
          { queryKey: ["feeds", "items"] },
          (old) => filterFromCache(old, (item) => item.feed.id === feedId),
        );
      }

      // Return snapshots in context
      return { previousSubscriptions, previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback to snapshots on failure
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(
          ["subscriptions"],
          context.previousSubscriptions,
        );
      }
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      // Force invalidation to sync client cache with DB truth
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
