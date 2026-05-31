"use client";

import { toast } from "sonner";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";
import { useRefreshFeed } from "@/hooks/feed/use-refresh-feed";
import type { RefreshFeedInput } from "@/lib/validations/feed";

/**
 * UI hook for "Refresh" logic.
 * Encapsulates the refresh mutation with global toast notifications.
 */
export function useRefreshUI() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: feeds } = useFeeds();
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

  // Calculate refresh metadata for the current view
  const { lastFetchedAt, failedFeeds } = (() => {
    if (!feeds) return { lastFetchedAt: null, failedFeeds: [] };

    let targetSubscriptions = feeds;

    if (feedId) {
      targetSubscriptions = feeds.filter((f) => f.feed.id === feedId);
    } else if (categoryId) {
      targetSubscriptions = feeds.filter(
        (f) => f.subscription.categoryId === categoryId,
      );
    }

    if (targetSubscriptions.length === 0) {
      return { lastFetchedAt: null, failedFeeds: [] };
    }

    // 1. Find the most recent fetch attempt
    const fetchTimes = targetSubscriptions
      .map((s) =>
        s.feed.lastFetchedAt ? new Date(s.feed.lastFetchedAt).getTime() : 0,
      )
      .filter((t) => t > 0);

    const latestFetch =
      fetchTimes.length > 0 ? new Date(Math.max(...fetchTimes)) : null;

    // 2. Identify failed feeds
    const failed = targetSubscriptions
      .filter((s) => s.feed.healthStatus === "error")
      .map(
        (s) => s.subscription.customTitle ?? s.feed.title ?? "Untitled Feed",
      );

    return {
      lastFetchedAt: latestFetch,
      failedFeeds: failed,
    };
  })();

  return {
    feedId,
    categoryId,
    isRefreshing,
    lastFetchedAt,
    failedFeeds,
    handleRefresh,
  };
}
