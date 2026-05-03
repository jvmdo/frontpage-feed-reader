"use client";

import { toast } from "sonner";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useRefreshFeed } from "@/hooks/feed/use-refresh-feed";
import type { RefreshFeedInput } from "@/lib/validations/feed";

/**
 * UI hook for "Refresh" logic.
 * Encapsulates the refresh mutation with global toast notifications.
 */
export function useRefreshUI() {
  const { feedId, categoryId } = useFeedFilter();
  const { mutate: refreshFeed, isPending: isRefreshing } = useRefreshFeed();

  const handleRefresh = () => {
    let input: RefreshFeedInput;
    let label: string;

    if (feedId) {
      input = { scope: "feed", id: feedId };
      label = "Feed";
    } else if (categoryId) {
      input = { scope: "category", id: categoryId };
      label = "Category";
    } else {
      input = { scope: "global" };
      label = "All feeds";
    }

    refreshFeed(input, {
      onSuccess: () => {
        toast.success(`${label} refreshed`);
      },
      onError: (error) => {
        toast.error(
          error.message || `Failed to refresh ${label.toLowerCase()}`,
        );
      },
    });
  };

  return {
    feedId,
    categoryId,
    isRefreshing,
    handleRefresh,
  };
}
