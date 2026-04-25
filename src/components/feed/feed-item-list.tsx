"use client";

import { FolderIcon, RssIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import FeedItemListSkeleton from "@/components/feed/feed-item-list-skeleton";
import { InfiniteScrollTrigger } from "@/components/feed/infinite-scroll-trigger";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useFeedItems } from "@/hooks/use-feed-items";
import { getFeedScroll } from "@/lib/feed/scroll-store";
import type { Category } from "@/types";

export function FeedItemList() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: categories } = useCategories();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeedItems();

  // Restore scroll position when switching feeds/categories
  useLayoutEffect(() => {
    window.scrollTo({
      top: getFeedScroll(feedId || categoryId),
      behavior: "instant",
    });
  }, [feedId, categoryId]);

  const allItems = data?.pages?.flat() ?? [];

  if (!allItems.length) {
    return <FeedEmptyState categoryId={categoryId} categories={categories} />;
  }

  return (
    <div className="flex flex-col pb-8">
      {allItems.map((itemWithSource) => (
        <FeedItemCard key={itemWithSource.item.id} data={itemWithSource} />
      ))}

      {isFetchingNextPage && (
        <FeedItemListSkeleton>Loading more items...</FeedItemListSkeleton>
      )}

      {hasNextPage && (
        <InfiniteScrollTrigger
          onIntersect={fetchNextPage}
          enabled={!isFetchingNextPage}
        />
      )}
    </div>
  );
}

function FeedEmptyState({
  categoryId,
  categories,
}: {
  categoryId: number | null;
  categories: Category[];
}) {
  if (!categoryId) {
    return (
      <EmptyState
        title="Your feed is empty"
        description="Subscribe to more feeds or refresh your current ones to see new articles here."
        icon={RssIcon}
      />
    );
  }

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name || "This category";

  return (
    <EmptyState
      title={`${categoryName} has no items yet`}
      description="There are no feeds assigned to this category or the assigned feeds haven't published anything yet."
      icon={FolderIcon}
      action={
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm">
            Assign feeds to this category to see them here.
          </p>
          <AssignFeedsDialog categoryId={categoryId}>
            <Button variant="outline">Assign feeds</Button>
          </AssignFeedsDialog>
        </div>
      }
    />
  );
}
