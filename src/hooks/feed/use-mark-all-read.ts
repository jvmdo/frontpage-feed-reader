import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { markAllReadAction } from "@/actions/feed/mark-all-read-action";
import { useFeeds } from "@/hooks/feed/use-feeds";
import type { GenericCacheData } from "@/hooks/item/cache";
import { updateInCache } from "@/hooks/item/cache";
import type { MarkAllReadInput } from "@/lib/validations/feed";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type { ItemWithSource, ListItemWithSource } from "@/types";

type CacheData = GenericCacheData<ListItemWithSource, ItemWithSource>;

/**
 * Custom hook for marking all items in a scope as read.
 * Optimistically updates the unread counts and feed items caches.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { data: subscriptions } = useFeeds();

  return useMutation({
    mutationKey: ["feeds", "items", "mark-all-read"],
    mutationFn: async (input: MarkAllReadInput) => {
      const response = await markAllReadAction(input);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onMutate: async (variables) => {
      const { scope, id } = variables;

      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feeds", "unread-counts"] });
      await queryClient.cancelQueries({ queryKey: ["feeds", "items"] });

      // 2. Snapshot current counts for rollback
      const previousCounts = queryClient.getQueryData<UnreadCounts>([
        "feeds",
        "unread-counts",
      ]);

      // 3. Optimistically update unread counts
      if (previousCounts) {
        queryClient.setQueryData<UnreadCounts>(
          ["feeds", "unread-counts"],
          (old) => {
            if (!old) return old;

            const next: UnreadCounts = {
              ...old,
              categories: { ...old.categories },
              feeds: { ...old.feeds },
            };

            if (scope === "global") {
              next.global = 0;
              next.categories = {};
              next.feeds = {};
            } else if (scope === "category" && id) {
              const catCount = old.categories[id] || 0;
              next.global = Math.max(0, next.global - catCount);
              next.categories[id] = 0;

              // Zero out all feeds in this category
              for (const sub of subscriptions || []) {
                if (sub.subscription.categoryId === id) {
                  next.feeds[sub.feed.id] = 0;
                }
              }
            } else if (scope === "feed" && id) {
              const feedCount = old.feeds[id] || 0;
              next.global = Math.max(0, next.global - feedCount);
              next.feeds[id] = 0;

              // Find category and subtract from it too
              const sub = (subscriptions || []).find((s) => s.feed.id === id);
              if (sub?.subscription.categoryId) {
                const catId = sub.subscription.categoryId;
                next.categories[catId] = Math.max(
                  0,
                  (next.categories[catId] || 0) - feedCount,
                );
              }
            }

            return next;
          },
        );
      }

      // 4. Optimistically update items in all queries
      queryClient.setQueriesData<CacheData>(
        { queryKey: ["feeds", "items"] },
        (old) =>
          updateInCache(
            old,
            (itemWithSource) => {
              if (scope === "global") return true;
              if (scope === "category" && id) {
                const sub = (subscriptions || []).find(
                  (s) => s.feed.id === itemWithSource.feed.id,
                );
                return sub?.subscription.categoryId === id;
              }
              if (scope === "feed" && id) {
                return itemWithSource.feed.id === id;
              }
              return false;
            },
            (itemWithSource) => ({ ...itemWithSource, isRead: true }),
          ),
      );

      return { previousCounts };
    },
    onError: (_err, _variables, context) => {
      // Rollback unread counts
      if (context?.previousCounts) {
        queryClient.setQueryData(
          ["feeds", "unread-counts"],
          context.previousCounts,
        );
      }
      // Invalidate items to fetch correct state
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
    onSettled: () => {
      // Final sync with server, only when last mutation settles
      if (
        queryClient.isMutating({
          mutationKey: ["feeds", "items", "mark-all-read"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
        queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
      }
    },
  });
}
