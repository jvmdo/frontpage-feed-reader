"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toggleBookmarkAction } from "@/actions/item/toggle-bookmark-action";
import type { ToggleBookmarkInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type { ItemWithSource, ListItemWithSource } from "@/types";

type CacheData = InfiniteData<ListItemWithSource[]> | ItemWithSource;

/**
 * Finds an item in the cache and returns its metadata for optimistic updates.
 */
function findItemInCache(
  queries: [readonly unknown[], CacheData | undefined][],
  itemId: number,
): {
  isBookmarked: boolean;
  isRead: boolean;
  feedId: number | null;
} {
  for (const [_, data] of queries) {
    if (!data) continue;

    if ("pages" in data) {
      for (const page of data.pages) {
        if (!Array.isArray(page)) continue;
        const found = page.find((i) => i.item.id === itemId);
        if (found) {
          return {
            isBookmarked: !!found.isBookmarked,
            isRead: !!found.isRead,
            feedId: found.feed.id,
          };
        }
      }
    } else if (
      data &&
      typeof data === "object" &&
      "item" in data &&
      data.item &&
      data.item.id === itemId
    ) {
      return {
        isBookmarked: !!data.isBookmarked,
        isRead: !!data.isRead,
        feedId: data.feed.id,
      };
    }
  }

  return { isBookmarked: false, isRead: false, feedId: null };
}

/**
 * Updates the bookmark status of an item in the cache.
 */
function toggleBookmarkInCache(
  old: CacheData | undefined,
  itemId: number,
  newBookmarkedAt: Date | null,
): CacheData | undefined {
  if (!old) return old;

  if ("pages" in old) {
    return {
      ...old,
      pages: old.pages.map((page) => {
        if (!Array.isArray(page)) return page;
        return page.map((i) =>
          i.item.id === itemId
            ? {
                ...i,
                isBookmarked: !!newBookmarkedAt,
                bookmarkedAt: newBookmarkedAt,
              }
            : i,
        );
      }),
    };
  }

  if (
    old &&
    typeof old === "object" &&
    "item" in old &&
    old.item &&
    old.item.id === itemId
  ) {
    return {
      ...old,
      isBookmarked: !!newBookmarkedAt,
      bookmarkedAt: newBookmarkedAt,
    };
  }

  return old;
}

/**
 * Hook for toggling the bookmark status of an item.
 * Implements optimistic updates for both the item state and the unread bookmark count.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
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
      const { isBookmarked, isRead } = findItemInCache(previousQueries, itemId);

      // 4. Optimistically update item state
      const newBookmarkedAt = isBookmarked ? null : new Date();
      queryClient.setQueriesData<CacheData>(
        { queryKey: ["feeds", "items"] },
        (old) => toggleBookmarkInCache(old, itemId, newBookmarkedAt),
      );

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
      // Rollback on error
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
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      queryClient.invalidateQueries({
        queryKey: ["feeds", "items"],
        refetchType: "active",
      });
    },
  });
}
