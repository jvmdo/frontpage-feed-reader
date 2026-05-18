"use client";

import { FolderIcon, RssIcon } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { ItemCard } from "@/components/feed/item-card";
import ItemListSkeleton from "@/components/feed/item-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useItems } from "@/hooks/item/use-items";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Category, ListItemWithSource } from "@/types";

interface VirtuosoContext {
  isFetching: boolean;
  isGrid: boolean;
}

/**
 * Stable component definition for the footer to prevent Virtuoso remounts.
 * Uses the 'context' prop to react to state changes without changing reference.
 */
const ListFooter = ({ context }: { context?: VirtuosoContext }) => {
  const isGrid = context?.isGrid;

  if (!context?.isFetching) {
    return <div className={cn(isGrid && "col-span-full", "h-8")} />;
  }

  return (
    <div
      className={cn(
        isGrid && "col-span-full",
        "pb-8 pt-4 flex justify-center w-full",
      )}
    >
      <ItemListSkeleton count={isGrid ? 4 : 2}>
        Loading more items...
      </ItemListSkeleton>
    </div>
  );
};

const virtuosoComponents = {
  Footer: ListFooter,
};

export function ItemList() {
  const { feedId, categoryId, isSaved } = useFeedFilter();
  const { data: categories } = useCategories();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useItems();
  const { isTourActive } = useTourStore();
  const { layout } = useViewOptions();

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  // Identify the scroll container on mount
  useLayoutEffect(() => {
    setScrollParent(document.getElementById("feed-container"));
  }, []);

  const items = data?.pages?.flat() ?? [];

  const context: VirtuosoContext = {
    isFetching: isFetchingNextPage,
    isGrid: layout === FeedLayout.Grid,
  };

  if (!items.length) {
    return (
      <FeedEmptyState
        categoryId={categoryId}
        categories={categories}
        isSaved={isSaved}
      />
    );
  }

  // Find the index of the first item from the welcome feed
  const firstWelcomeItemIndex = items.findIndex(
    (item) => item.feed.url === WELCOME_FEED_URL,
  );

  // Disable virtualization during tour for stable positioning
  if (isTourActive) {
    return (
      <div
        className={cn(
          "flex flex-col",
          layout === FeedLayout.Grid &&
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4",
        )}
      >
        {items.map((itemWithSource, index) => (
          <ItemCard
            key={itemWithSource.item.id}
            data={itemWithSource}
            data-tour={
              index === firstWelcomeItemIndex ? "welcome-item" : undefined
            }
            layout={layout}
          />
        ))}
      </div>
    );
  }

  const sharedProps = {
    customScrollParent: scrollParent || undefined,
    data: items,
    itemContent: (_: number, itemWithSource: ListItemWithSource) => (
      <ItemCard
        key={itemWithSource.item.id}
        data={itemWithSource}
        layout={layout}
      />
    ),
    endReached: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    components: virtuosoComponents,
    context,
    overscan: 400, // Buffer for smoother scrolling
  };

  const listKey = `feed-${feedId || "all"}-cat-${categoryId || "none"}-saved-${isSaved}`;

  if (layout === FeedLayout.Grid) {
    return (
      <VirtuosoGrid
        {...sharedProps}
        key={`grid-${listKey}`}
        listClassName="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4 p-2 mt-2"
        itemClassName="flex"
      />
    );
  }

  return <Virtuoso {...sharedProps} key={`list-${listKey}`} />;
}

function FeedEmptyState({
  categoryId,
  categories,
  isSaved,
}: {
  categoryId: number | null;
  categories: Category[];
  isSaved: boolean;
}) {
  if (isSaved) {
    return (
      <EmptyState
        title={<h3>No saved items yet</h3>}
        description="Articles you save for later will appear here, even after they've been read."
        icon={RssIcon}
      />
    );
  }

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
