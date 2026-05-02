"use client";

import { toast } from "sonner";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useRefreshFeed } from "@/hooks/feed/use-refresh-feed";

/**
 * UI hook for "Refresh" logic.
 * Encapsulates the refresh mutation with global toast notifications.
 */
export function useRefreshUI() {
  const { feedId } = useFeedFilter();
  const { mutate: refreshFeed, isPending: isRefreshing } = useRefreshFeed();

  const handleRefresh = () => {
    if (!feedId) return;

    refreshFeed(
      { feedId },
      {
        onSuccess: () => {
          toast.success("Feed refreshed");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to refresh feed");
        },
      },
    );
  };

  return {
    feedId,
    isRefreshing,
    handleRefresh,
  };
}
