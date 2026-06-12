"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markReadAction } from "@/actions/item/mark-read-action";
import type { MarkReadInput } from "@/lib/validations/feed";
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
 * Hook for marking the status of an item as read.
 * Implements optimistic updates for both the item state and the unread count.
 */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["feeds", "items", "mark-read"],
    mutationFn: async (input: MarkReadInput) => {
      const response = await markReadAction(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },

    onMutate: async ({ itemId }) => {
      // 1. Cancel outgoing refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ["feeds", "items"] });
      await queryClient.cancelQueries({ queryKey: ["feeds", "unread-counts"] });

      // 2. Snapshot current state for rollback
      const previousQueries = queryClient.getQueriesData<CacheData>({
        queryKey: ["feeds", "items"],
      });
      const previousCounts = queryClient.getQueryData<UnreadCounts>([
        "feeds",
        "unread-counts",
      ]);
      const subscriptions = queryClient.getQueryData<FeedWithSubscription[]>([
        "subscriptions",
      ]);

      // 3. Identify the item context
      const found = findInCache(previousQueries, (i) => i.item.id === itemId);
      const isUnread = found ? !found.isRead : false;
      const feedId = found ? found.feed.id : null;

      // 4. Update items across all cached queries
      queryClient.setQueriesData<CacheData>(
        { queryKey: ["feeds", "items"] },
        (old) =>
          updateInCache(
            old,
            (i) => i.item.id === itemId,
            (item) => ({
              ...item,
              isRead: true,
            }),
          ),
      );

      // 5. Update unread counts if the item was unread
      if (isUnread && previousCounts) {
        const next: UnreadCounts = {
          ...previousCounts,
          categories: { ...(previousCounts.categories || {}) },
          feeds: { ...(previousCounts.feeds || {}) },
          global:
            typeof previousCounts.global === "number"
              ? previousCounts.global
              : 0,
        };

        // Decrement global
        next.global = Math.max(0, next.global - 1);

        // Decrement feed and category if applicable
        if (feedId) {
          const currentFeedCount = next.feeds[feedId] || 0;
          next.feeds[feedId] = Math.max(0, currentFeedCount - 1);

          const sub = (subscriptions || []).find((s) => s.feed.id === feedId);
          if (sub?.subscription.categoryId) {
            const catId = sub.subscription.categoryId;
            const currentCatCount = next.categories[catId] || 0;
            next.categories[catId] = Math.max(0, currentCatCount - 1);
          }
        }

        queryClient.setQueryData(["feeds", "unread-counts"], next);
      }

      return { previousQueries, previousCounts };
    },

    onError: (_err, _variables, context) => {
      for (const [queryKey, data] of context?.previousQueries ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      if (context?.previousCounts) {
        queryClient.setQueryData(
          ["feeds", "unread-counts"],
          context.previousCounts,
        );
      }
    },

    onSettled: () => {
      // Only invalidate queries when the last mutation of this key settles
      if (
        queryClient.isMutating({
          mutationKey: ["feeds", "items", "mark-read"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
        queryClient.invalidateQueries({
          queryKey: ["feeds", "items"],
          refetchType: "active",
        });
      }
    },
  });
}
