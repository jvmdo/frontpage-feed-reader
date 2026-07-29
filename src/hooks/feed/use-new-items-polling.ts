import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useItems } from "@/hooks/item/use-items";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { useViewOptions } from "@/hooks/ui/use-view-options";
import { queryKeys } from "@/lib/query-keys";
import { getDefaultSorting } from "@/lib/sorting";

interface UseNewItemsPollingOptions {
  onBeforeRefresh?: () => void;
}

/**
 * Custom hook to poll for new items published after the current view's latest item.
 * Returns the count of new items and a handler to refresh the list.
 */
export function useNewItemsPolling(options: UseNewItemsPollingOptions = {}) {
  const { onBeforeRefresh } = options;
  const { feedId, categoryId, isSaved, status, feedIds } = useFeedFilter();
  const { sortBy: urlSortBy, sortOrder: urlSortOrder } = useViewOptions();
  const { isTourActive } = useTourStore();
  const queryClient = useQueryClient();

  const defaultSort = getDefaultSorting({ isSaved });
  const sortOrder = urlSortOrder ?? defaultSort.sortOrder;
  const sortBy = urlSortBy ?? defaultSort.sortBy;

  const isNewestFirst = sortBy === "publishedAt" && sortOrder === "desc";
  const isReadFilter = status === "read";

  // Find the maximum publishedAt timestamp across all items currently loaded in the client cache
  const { data } = useItems();
  const latestItemDate =
    data?.reduce(
      (max, item) => {
        const publishedAt = item.item.publishedAt;
        if (!publishedAt) return max;
        const publishedDate = new Date(publishedAt);
        return !max || publishedDate.getTime() > max.getTime()
          ? publishedDate
          : max;
      },
      null as Date | null,
    ) ?? undefined;

  const isUnreadOnly = status === "unread";

  const { data: newItemsCount } = useQuery({
    queryKey: queryKeys.newItemsCount.all(
      feedId,
      categoryId,
      isUnreadOnly,
      [...feedIds].sort(),
      latestItemDate?.toISOString(),
    ),
    queryFn: async () => {
      if (!latestItemDate) return 0;

      const params = new URLSearchParams({
        since: latestItemDate.toISOString(),
        ...(feedId && { feedId: feedId.toString() }),
        ...(categoryId && { categoryId: categoryId.toString() }),
        ...(isUnreadOnly && { unreadOnly: "true" }),
        ...(feedIds?.length ? { feedIds: feedIds.join(",") } : {}),
      });

      const response = await fetch(`/api/feeds/check-new?${params.toString()}`);
      if (!response.ok) return 0;

      const res = await response.json();
      return res.count as number;
    },
    enabled:
      !!latestItemDate &&
      !isTourActive &&
      !isSaved &&
      isNewestFirst &&
      !isReadFilter,
    refetchInterval: 60000, // 60 seconds
  });

  const handleLoadNew = () => {
    onBeforeRefresh?.();
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
    queryClient.setQueryData(
      queryKeys.newItemsCount.all(
        feedId,
        categoryId,
        isUnreadOnly,
        [...feedIds].sort(),
        latestItemDate?.toISOString(),
      ),
      0,
    );
  };

  return {
    newItemsCount: newItemsCount ?? 0,
    handleLoadNew,
  };
}
