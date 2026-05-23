import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkNewItemsAction } from "@/actions/feed/check-new-items-action";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useItems } from "@/hooks/item/use-items";
import { useTourStore } from "@/hooks/ui/use-tour-store";

interface UseNewItemsPollingOptions {
  onBeforeRefresh?: () => void;
}

/**
 * Custom hook to poll for new items published after the current view's latest item.
 * Returns the count of new items and a handler to refresh the list.
 */
export function useNewItemsPolling(options: UseNewItemsPollingOptions = {}) {
  const { onBeforeRefresh } = options;
  const { feedId, categoryId, isSaved } = useFeedFilter();
  const { isTourActive } = useTourStore();
  const queryClient = useQueryClient();

  // Get the latest item date from the existing cache
  const { data } = useItems();
  const latestItemDate = data?.pages?.[0]?.[0]?.item.publishedAt;

  const { data: newItemsCount } = useQuery({
    queryKey: ["new-items-count", feedId, categoryId],
    queryFn: async () => {
      if (!latestItemDate) return 0;

      const res = await checkNewItemsAction({
        feedId,
        categoryId,
        since: latestItemDate,
      });

      return res.success ? (res.data as { count: number }).count : 0;
    },
    enabled: !!latestItemDate && !isTourActive && !isSaved,
    refetchInterval: 60000, // 60 seconds
  });

  const handleLoadNew = () => {
    onBeforeRefresh?.();
    queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    queryClient.setQueryData(["new-items-count", feedId, categoryId], 0);
  };

  return {
    newItemsCount: newItemsCount ?? 0,
    handleLoadNew,
  };
}
