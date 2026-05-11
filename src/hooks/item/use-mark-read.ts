"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { markReadAction } from "@/actions/item/mark-read-action";
import type { MarkReadInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type {
  FeedWithSubscription,
  ItemWithSource,
  ListItemWithSource,
} from "@/types";

type CacheData = InfiniteData<ListItemWithSource[]> | ItemWithSource;

function findItemInCache(
  queries: [readonly unknown[], CacheData | undefined][],
  itemId: number,
): { isUnread: boolean; feedId: number | null } {
  for (const [_, data] of queries) {
    if (!data) continue;

    if ("pages" in data) {
      for (const page of data.pages) {
        if (!Array.isArray(page)) continue;
        const found = page.find((i) => i.item.id === itemId);
        if (found) return { isUnread: !found.isRead, feedId: found.feed.id };
      }
    } else if (
      data &&
      typeof data === "object" &&
      "item" in data &&
      data.item &&
      data.item.id === itemId
    ) {
      return { isUnread: !data.isRead, feedId: data.feed.id };
    }
  }

  return { isUnread: false, feedId: null };
}

function markReadInCache(old: CacheData | undefined, itemId: number) {
  if (!old) return old;

  if ("pages" in old) {
    return {
      ...old,
      pages: old.pages.map((page) => {
        if (!Array.isArray(page)) return page;
        return page.map((i) =>
          i.item.id === itemId ? { ...i, isRead: true } : i,
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
    return { ...old, isRead: true };
  }

  return old;
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
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
      const { isUnread, feedId } = findItemInCache(previousQueries, itemId);

      // 4. Update items across all cached queries
      queryClient.setQueriesData<CacheData>(
        { queryKey: ["feeds", "items"] },
        (old) => markReadInCache(old, itemId),
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
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      queryClient.invalidateQueries({
        queryKey: ["feeds", "items"],
        refetchType: "active",
      });
    },
  });
}
