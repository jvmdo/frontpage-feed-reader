"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { markAsReadAction } from "@/actions/feed-item/mark-as-read-action";
import type { MarkAsReadInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type { FeedItemWithSource } from "@/types";

/**
 * Custom hook for marking a feed item as read.
 * Optimistically updates the feed items and unread counts caches for instant feedback.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MarkAsReadInput) => {
      const response = await markAsReadAction(input);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (variables) => {
      const { itemId } = variables;

      // 1. Cancel outgoing refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ["feeds", "items"] });
      await queryClient.cancelQueries({ queryKey: ["feeds", "unread-counts"] });

      // 2. Snapshot current state for rollback
      const previousQueries = queryClient.getQueriesData<
        InfiniteData<FeedItemWithSource[]>
      >({
        queryKey: ["feeds", "items"],
      });
      const previousCounts = queryClient.getQueryData<UnreadCounts>([
        "feeds",
        "unread-counts",
      ]);

      let itemWasUnread = false;

      // 3. Optimistically update items in all related feeds
      queryClient.setQueriesData<InfiniteData<FeedItemWithSource[]>>(
        { queryKey: ["feeds", "items"] },
        (old) => {
          if (!old) return old;

          const newPages = old.pages.map((page) =>
            page.map((itemWithSource) => {
              if (itemWithSource.item.id === itemId) {
                if (!itemWithSource.isRead) {
                  itemWasUnread = true;
                }
                return { ...itemWithSource, isRead: true };
              }
              return itemWithSource;
            }),
          );

          return { ...old, pages: newPages };
        },
      );

      // 4. Optimistically decrement unread count if applicable
      if (itemWasUnread && previousCounts) {
        queryClient.setQueryData<UnreadCounts>(["feeds", "unread-counts"], {
          ...previousCounts,
          global: Math.max(0, previousCounts.global - 1),
        });
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
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
    },
  });
}
