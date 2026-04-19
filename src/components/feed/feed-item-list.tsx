"use client";

import { RssIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import FeedItemListSkeleton from "@/components/feed/feed-item-list-skeleton";
import { InfiniteScrollTrigger } from "@/components/feed/infinite-scroll-trigger";
import { EmptyState } from "@/components/shared/empty-state";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useFeedItems } from "@/hooks/use-feed-items";
import { getFeedScroll } from "@/lib/feed/scroll-store";

export function FeedItemList() {
  const { feedId } = useFeedFilter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeedItems();

  // Restore scroll position when switching feeds
  useLayoutEffect(() => {
    const savedScroll = getFeedScroll(feedId);
    window.scrollTo({ top: savedScroll, behavior: "instant" });
  }, [feedId]);

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
