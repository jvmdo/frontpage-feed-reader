"use client";

import { RssIcon } from "lucide-react";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import FeedItemListSkeleton from "@/components/feed/feed-item-list-skeleton";
import { InfiniteScrollTrigger } from "@/components/feed/infinite-scroll-trigger";
import { EmptyState } from "@/components/shared/empty-state";
import { useFeedItems } from "@/hooks/use-feed-items";

export function FeedItemList() {
  const { data, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeedItems();

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="We couldn't load your feed items. Please try refreshing the page."
        icon={RssIcon}
      />
    );
  }

  const allItems = data.pages.flat() || [];

  if (allItems.length === 0) {
    return (
      <EmptyState
        title="Your feed is empty"
        description="Subscribe to more feeds or refresh your current ones to see new articles here."
        icon={RssIcon}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {allItems.map((itemWithSource) => (
        <FeedItemCard key={itemWithSource.item.id} data={itemWithSource} />
      ))}

      {isFetchingNextPage && (
        <FeedItemListSkeleton>Loading more items...</FeedItemListSkeleton>
      )}

      {hasNextPage && (
        <InfiniteScrollTrigger
          onIntersect={() => fetchNextPage()}
          enabled={!isFetchingNextPage}
        />
      )}
    </div>
  );
}
