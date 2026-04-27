"use client";

import { FolderIcon, RssIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { FeedItemCard } from "@/components/feed/feed-item-card";
import FeedItemListSkeleton from "@/components/feed/feed-item-list-skeleton";
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

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  // Identify the scroll container on mount
  useLayoutEffect(() => {
    setScrollParent(document.getElementById("feed-container"));
  }, []);

  // Handle scroll restoration when filter changes
  useLayoutEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollTo({
        top: getFeedScroll(feedId || categoryId),
      });
    }
  }, [feedId, categoryId]);

  const allItems = data?.pages?.flat() ?? [];

  if (!allItems.length) {
    return <FeedEmptyState categoryId={categoryId} categories={categories} />;
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      customScrollParent={scrollParent || undefined}
      initialScrollTop={getFeedScroll(feedId || categoryId)}
      data={allItems}
      itemContent={(_index, itemWithSource) => (
        <FeedItemCard key={itemWithSource.item.id} data={itemWithSource} />
      )}
      endReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      components={{
        Footer: () =>
          isFetchingNextPage ? (
            <div className="pb-8 pt-4">
              <FeedItemListSkeleton>Loading more items...</FeedItemListSkeleton>
            </div>
          ) : (
            <div className="h-8" />
          ),
      }}
    />
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
        title={<h3>Your feed is empty</h3>}
        description="Subscribe to more feeds or refresh your current ones to see new articles here."
        icon={RssIcon}
      />
    );
  }

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name || "This category";

  return (
    <EmptyState
      title={<h3>{categoryName} has no items yet</h3>}
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
