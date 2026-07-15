import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setReadStatusAction } from "@/actions/item/set-read-status-action";
import { queryKeys } from "@/lib/query-keys";
import type { SetReadStatusInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type {
  FeedWithSubscription,
  ItemWithSource,
  ListItemWithSource,
} from "@/types";
import { findInCache, updateInCache } from "./cache";

type CacheData = GenericCacheData<ListItemWithSource, ItemWithSource>;

import type { GenericCacheData } from "./cache";

/**
 * Hook for setting the status of an item as read or unread.
 * Implements optimistic updates for both the item state and the unread count.
 */
export function useSetReadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["feeds", "items", "set-read-status"],
    mutationFn: async (input: SetReadStatusInput) => {
      const response = await setReadStatusAction(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },

    onMutate: async ({ itemId, isRead = true }) => {
      // 1. Cancel outgoing refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({
        queryKey: queryKeys.feeds.items.all(),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.unreadCounts.all });

      // 2. Snapshot current state for rollback
      const previousQueries = queryClient.getQueriesData<CacheData>({
        queryKey: queryKeys.feeds.items.all(),
      });
      const previousCounts = queryClient.getQueryData<UnreadCounts>(
        queryKeys.unreadCounts.all,
      );
      const subscriptions = queryClient.getQueryData<FeedWithSubscription[]>(
        queryKeys.subscriptions.all,
      );

      // 3. Identify the item context
      const found = findInCache(previousQueries, (i) => i.item.id === itemId);
      const wasRead = found ? found.isRead : false;
      const feedId = found ? found.feed.id : null;

      let countChange = 0;
      if (isRead && !wasRead) {
        countChange = -1; // Decrement
      } else if (!isRead && wasRead) {
        countChange = 1; // Increment
      }

      // 4. Update items across all cached queries
      queryClient.setQueriesData<CacheData>(
        { queryKey: queryKeys.feeds.items.all() },
        (old) =>
          updateInCache(
            old,
            (i) => i.item.id === itemId,
            (item) => ({
              ...item,
              isRead: isRead,
            }),
          ),
      );

      // 5. Update unread counts if counts changed
      if (countChange !== 0 && previousCounts) {
        const next: UnreadCounts = {
          ...previousCounts,
          categories: { ...(previousCounts.categories || {}) },
          feeds: { ...(previousCounts.feeds || {}) },
          global:
            typeof previousCounts.global === "number"
              ? previousCounts.global
              : 0,
        };

        // Update global
        next.global = Math.max(0, next.global + countChange);

        // Update feed and category if applicable
        if (feedId) {
          const currentFeedCount = next.feeds[feedId] || 0;
          next.feeds[feedId] = Math.max(0, currentFeedCount + countChange);

          const sub = (subscriptions || []).find((s) => s.feed.id === feedId);
          if (sub?.subscription.categoryId) {
            const catId = sub.subscription.categoryId;
            const currentCatCount = next.categories[catId] || 0;
            next.categories[catId] = Math.max(0, currentCatCount + countChange);
          }
        }

        queryClient.setQueryData(queryKeys.unreadCounts.all, next);
      }

      return { previousQueries, previousCounts };
    },

    onError: (_err, _variables, context) => {
      for (const [queryKey, data] of context?.previousQueries ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context?.previousCounts) {
        queryClient.setQueryData(
          queryKeys.unreadCounts.all,
          context.previousCounts,
        );
      }
    },

    onSettled: () => {
      // Only invalidate queries when the last mutation of this key settles
      if (
        queryClient.isMutating({
          mutationKey: ["feeds", "items", "set-read-status"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
        queryClient.invalidateQueries({
          queryKey: queryKeys.feeds.items.all(),
          refetchType: "none",
        });
      }
    },
  });
}
