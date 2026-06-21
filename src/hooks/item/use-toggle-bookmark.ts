"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleBookmarkAction } from "@/actions/item/toggle-bookmark-action";
import type { ToggleBookmarkInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type { ItemWithSource, ListItemWithSource } from "@/types";
import {
  filterFromCache,
  findInCache,
  hasInCache,
  prependToCache,
  updateInCache,
} from "./cache";

type CacheData = GenericCacheData<ListItemWithSource, ItemWithSource>;

import type { GenericCacheData } from "./cache";

/**
 * Hook for toggling the bookmark status of an item.
 * Implements optimistic updates for both the item state and the unread bookmark count.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["feeds", "items", "bookmark"],
    mutationFn: async (input: ToggleBookmarkInput) => {
      const response = await toggleBookmarkAction(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },

    onMutate: async ({ itemId }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feeds", "items"] });
      await queryClient.cancelQueries({ queryKey: ["feeds", "unread-counts"] });

      // 2. Snapshot current state
      const previousQueries = queryClient.getQueriesData<CacheData>({
        queryKey: ["feeds", "items"],
      });
      const previousCounts = queryClient.getQueryData<UnreadCounts>([
        "feeds",
        "unread-counts",
      ]);

      // 3. Identify item context
      const found = findInCache(previousQueries, (i) => i.item.id === itemId);
      const isBookmarked = found ? !!found.isBookmarked : false;
      const isRead = found ? !!found.isRead : false;

      // 4. Optimistically update item state
      const newBookmarkedAt = isBookmarked ? null : new Date();
      for (const [queryKey, oldData] of previousQueries) {
        if (!oldData) continue;
        const queryKeyFilters = queryKey[2] as any;

        // If the query is "Saved Only" and the item is currently bookmarked,
        // unbookmarking it should filter it out.
        if (queryKeyFilters?.bookmarkedOnly && isBookmarked) {
          queryClient.setQueryData(
            queryKey,
            filterFromCache(oldData, (i) => i.item.id === itemId),
          );
        } else {
          if (hasInCache(oldData, (i) => i.item.id === itemId)) {
            // Just update its attributes in place
            queryClient.setQueryData(
              queryKey,
              updateInCache(
                oldData,
                (i) => i.item.id === itemId,
                (item) => ({
                  ...item,
                  isBookmarked: !isBookmarked,
                  bookmarkedAt: newBookmarkedAt,
                }),
              ),
            );
          } else if (
            queryKeyFilters?.bookmarkedOnly &&
            !isBookmarked &&
            found
          ) {
            // It's the Saved view cache, we are bookmarking, and the item isn't in it yet.
            // Optimistically prepend it to the first page.
            const updatedItem = {
              ...found,
              isBookmarked: true,
              bookmarkedAt: newBookmarkedAt,
            };

            queryClient.setQueryData(
              queryKey,
              prependToCache(oldData, updatedItem),
            );
          }
        }
      }

      // 5. Optimistically update unread bookmark count
      if (previousCounts && !isRead) {
        const next: UnreadCounts = {
          ...previousCounts,
          saved: previousCounts.saved || 0,
        };

        // If we just bookmarked an unread item, increment. If we removed, decrement.
        const diff = !isBookmarked ? 1 : -1;
        next.saved = Math.max(0, next.saved + diff);

        queryClient.setQueryData(["feeds", "unread-counts"], next);
      }

      return { previousQueries, previousCounts };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
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
          mutationKey: ["feeds", "items", "bookmark"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      }
    },
  });
}
