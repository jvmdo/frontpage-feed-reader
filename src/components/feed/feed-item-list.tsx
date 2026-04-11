"use client";

import { RssIcon } from "lucide-react";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import { FeedItemSkeleton } from "@/components/feed/feed-item-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useFeedItems } from "@/hooks/use-feed-items";

export function FeedItemList() {
  const { data, isLoading, isError } = useFeedItems();

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="We couldn't load your feed items. Please try refreshing the page."
        icon={RssIcon}
      />
    );
  }

  const hasNoItems = !isLoading && (!data || data.length === 0);

  if (hasNoItems) {
    return (
      <EmptyState
        title="Your feed is empty"
        description="Subscribe to more feeds or refresh your current ones to see new articles here."
        icon={RssIcon}
      />
    );
  }

  if (isLoading) {
    return (
      <section
        className="flex flex-col gap-4"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading feed items..."
      >
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list
          <FeedItemSkeleton key={`skeleton-${i}`} />
        ))}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {data?.map((itemWithSource) => (
        <FeedItemCard key={itemWithSource.item.id} data={itemWithSource} />
      ))}
    </section>
  );
}
