"use client";

import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";

/**
 * Client component to render a reactive dashboard header (title and description).
 * Reacts instantly to URL filter changes without a server round-trip.
 */
export function DashboardHeader() {
  const { feedId } = useFeedFilter();
  const { data } = useSubscriptions();

  let title = "All Items";
  let description = "Everything from your subscriptions in one place.";

  if (feedId) {
    const subWithFeed = data.find((sub) => sub.feed.id === feedId);
    if (subWithFeed) {
      title =
        subWithFeed.subscription.customTitle ||
        subWithFeed.feed.title ||
        "Untitled Feed";
      description = `Articles from ${title}.`;
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
