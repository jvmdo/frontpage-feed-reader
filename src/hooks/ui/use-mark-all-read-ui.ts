"use client";

import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllRead } from "@/hooks/feed/use-mark-all-read";
import { useUnreadCounts } from "@/hooks/feed/use-unread-counts";

/**
 * UI hook for "Mark all read" logic.
 * Encapsulates count derivation, disabled state, and scope labeling.
 */
export function useMarkAllReadUI() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: unreadCounts } = useUnreadCounts();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const currentCount = feedId
    ? unreadCounts?.feeds[feedId] || 0
    : categoryId
      ? unreadCounts?.categories[categoryId] || 0
      : unreadCounts?.global || 0;

  const isDisabled = isPending || currentCount === 0;

  const scopeLabel = feedId
    ? "this feed"
    : categoryId
      ? "this category"
      : "all your feeds";

  const handleMarkAllRead = () => {
    if (feedId) {
      markAllRead({ scope: "feed", id: feedId });
    } else if (categoryId) {
      markAllRead({ scope: "category", id: categoryId });
    } else {
      markAllRead({ scope: "global" });
    }
  };

  return {
    currentCount,
    isDisabled,
    isPending,
    scopeLabel,
    handleMarkAllRead,
  };
}
