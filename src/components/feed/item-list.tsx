"use client";

import {
  AlertCircleIcon,
  FolderIcon,
  RotateCcwIcon,
  RssIcon,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useErrorBoundary } from "react-error-boundary";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { ItemCard } from "@/components/feed/item-card";
import ItemListSkeleton from "@/components/feed/item-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItems } from "@/hooks/item/use-items";
import { useSetReadStatus } from "@/hooks/item/use-set-read-status";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { useFeedListShortcuts } from "@/hooks/ui/use-feed-list-shortcuts";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Category, ListItemWithSource } from "@/types";

interface VirtuosoContext {
  isFetching: boolean;
  isGrid: boolean;
  focusedIndex: number | null;
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
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { mutate: setReadStatus } = useSetReadStatus();
  const { mutate: toggleBookmark } = useToggleBookmark();

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const virtuosoRef = useRef<any>(null);

  // Identify the scroll container on mount
  useLayoutEffect(() => {
    setScrollParent(document.getElementById("feed-container"));
  }, []);

  const items = data ?? [];
  const listKey = `feed-${feedId || "all"}-cat-${categoryId || "none"}-saved-${isSaved}`;

  const { focusedIndex } = useFeedListShortcuts({
    totalItems: items.length,
    virtuosoRef,
    onOpen: (idx) => setActiveItemId(items[idx].item.id),
    onToggleRead: (idx) => {
      const it = items[idx];
      if (!it.isWatermarked) {
        setReadStatus({ itemId: it.item.id, isRead: !it.isRead });
      }
    },
    onToggleBookmark: (idx) => toggleBookmark({ itemId: items[idx].item.id }),
    enabled: !activeItemId && !isTourActive,
    resetKey: `${layout}-${listKey}`,
  });

  const context: VirtuosoContext = {
    isFetching: isFetchingNextPage,
    isGrid: layout === FeedLayout.Grid,
    focusedIndex,
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
            isFocused={index === focusedIndex}
          />
        ))}
      </div>
    );
  }

  const sharedProps = {
    customScrollParent: scrollParent || undefined,
    data: items,
    itemContent: (index: number, itemWithSource: ListItemWithSource) => (
      <ItemCard
        key={itemWithSource.item.id}
        data={itemWithSource}
        layout={layout}
        isFocused={index === context.focusedIndex}
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

  if (layout === FeedLayout.Grid) {
    return (
      <VirtuosoGrid
        ref={virtuosoRef}
        {...sharedProps}
        key={`grid-${listKey}`}
        listClassName="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4 p-2 mt-2"
        itemClassName="flex"
      />
    );
  }

  return (
    <Virtuoso ref={virtuosoRef} {...sharedProps} key={`list-${listKey}`} />
  );
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

export function ItemListErrorFallback() {
  const { resetBoundary } = useErrorBoundary();
  return (
    <EmptyState
      title={<h3>Failed to load articles</h3>}
      description="There was a problem querying the article list. This might be due to a temporary network drop."
      icon={AlertCircleIcon}
      action={
        <Button variant="outline" onClick={() => resetBoundary()}>
          <RotateCcwIcon className="size-4 mr-2" />
          Try again
        </Button>
      }
    />
  );
}
