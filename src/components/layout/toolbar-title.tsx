"use client";

import { useCategories } from "@/hooks/use-categories";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import type { Category, FeedWithSubscription } from "@/types";

/**
 * Helper to determine the header title based on current filters.
 */
function getHeaderContent(
  feedId: number | null,
  categoryId: number | null,
  subscriptions: FeedWithSubscription[],
  categories: Category[],
) {
  if (feedId) {
    const sub = subscriptions.find((s) => s.feed.id === feedId);
    if (sub) {
      return sub.subscription.customTitle || sub.feed.title || "Untitled Feed";
    }
  }

  if (categoryId) {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      return category.name;
    }
  }

  return "All Items";
}

export function ToolbarTitle({
  feedId,
  categoryId,
}: {
  feedId: number | null;
  categoryId: number | null;
}) {
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();
  const { data: unreadCounts } = useUnreadCounts();

  const title = getHeaderContent(
    feedId,
    categoryId,
    subscriptions || [],
    categories || [],
  );

  const currentCount = feedId
    ? unreadCounts?.feeds[feedId] || 0
    : categoryId
      ? unreadCounts?.categories[categoryId] || 0
      : unreadCounts?.global || 0;

  return (
    <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
      <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
        {title}
      </h1>
      {currentCount > 0 && (
        <output
          className="text-sm text-muted-foreground whitespace-nowrap"
          aria-label={`${currentCount} unread items`}
        >
          {currentCount} unread
        </output>
      )}
    </div>
  );
}
