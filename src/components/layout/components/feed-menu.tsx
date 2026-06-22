"use client";

import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  CheckCheckIcon,
  Grid2X2Icon,
  ListIcon,
  ListPlus,
  RotateCwIcon,
  Rows3Icon,
} from "lucide-react";
import type * as React from "react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { MarkAllReadDialog } from "@/components/layout/components/mark-all-read-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useRefreshUI } from "@/hooks/ui/use-refresh-ui";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";
import {
  getDefaultSorting,
  REVERSE_SORT_LOOKUP,
  SORT_OPTIONS,
} from "@/lib/sorting";
import { cn } from "@/lib/utils";
import { FilterMenuItems, FilterTriggerContent } from "./filter-dropdown";

interface FeedActionsMenuProps {
  children: React.ReactNode;
}

/**
 * Unified menu for feed-related actions, layout toggles, and sorting.
 * Consumes global state (filter, view options) internally.
 */
export function FeedMenu({ children }: FeedActionsMenuProps) {
  const isMobile = useIsMobile();
  const { categoryId, isSaved, status, setStatus, feedIds, setFeedIds } =
    useFeedFilter();
  const { isDisabled: isMarkAllDisabled } = useMarkAllReadUI();
  const { isRefreshing, handleRefresh } = useRefreshUI();
  const {
    layout,
    setLayout,
    sortBy: urlSortBy,
    sortOrder: urlSortOrder,
    setSorting,
  } = useViewOptions();

  const defaultSort = getDefaultSorting({ isSaved });
  const sortBy = urlSortBy ?? defaultSort.sortBy;
  const sortOrder = urlSortOrder ?? defaultSort.sortOrder;

  // Reverse lookup using a composite key
  const activeValue =
    REVERSE_SORT_LOOKUP[`${sortBy}-${sortOrder}`] || "newest_published";

  const isFilterActive = status !== "all";

  const handleValueChange = (v: string) => {
    const config = SORT_OPTIONS[v as keyof typeof SORT_OPTIONS];
    if (config) {
      setSorting(config.sortBy, config.sortOrder);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isMobile ? (
          <Drawer>
            <DrawerTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className={cn(isFilterActive && "text-primary")}
              >
                <FilterTriggerContent isFilterActive={isFilterActive} />
              </DropdownMenuItem>
            </DrawerTrigger>
            <DrawerContent className="p-4 pt-0">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Filter Items</DrawerTitle>
              </DrawerHeader>
              <FilterMenuItems
                isSaved={isSaved}
                status={status}
                setStatus={setStatus}
                feedIds={feedIds}
                setFeedIds={setFeedIds}
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className={cn(isFilterActive && "text-primary")}
            >
              <FilterTriggerContent isFilterActive={isFilterActive} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <FilterMenuItems
                isSaved={isSaved}
                status={status}
                setStatus={setStatus}
                feedIds={feedIds}
                setFeedIds={setFeedIds}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleRefresh}
          disabled={isRefreshing}
          onSelect={(e) => e.preventDefault()}
        >
          <RotateCwIcon
            className={cn("size-4", isRefreshing && "animate-spin")}
            data-icon="inline-start"
          />
          Refresh
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {categoryId && (
          <>
            <AssignFeedsDialog categoryId={categoryId}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ListPlus data-icon="inline-start" />
                Assign feeds
              </DropdownMenuItem>
            </AssignFeedsDialog>
            <DropdownMenuSeparator />
          </>
        )}

        <MarkAllReadDialog>
          <DropdownMenuItem
            disabled={isMarkAllDisabled}
            onSelect={(e) => e.preventDefault()}
          >
            <CheckCheckIcon data-icon="inline-start" />
            Mark all read
          </DropdownMenuItem>
        </MarkAllReadDialog>
        <DropdownMenuSeparator />

        <DropdownMenuLabel>Layout</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={layout}
          onValueChange={(v) => setLayout(v as FeedLayout)}
        >
          <DropdownMenuRadioItem value={FeedLayout.List}>
            <ListIcon data-icon="inline-start" />
            List
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={FeedLayout.Grid}>
            <Grid2X2Icon data-icon="inline-start" />
            Grid
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={FeedLayout.Rows}>
            <Rows3Icon data-icon="inline-start" />
            Rows
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />

        <DropdownMenuLabel>Order</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeValue}
          onValueChange={handleValueChange}
        >
          {isSaved && (
            <>
              <DropdownMenuRadioItem value="recently_saved">
                <ArrowDownAZIcon data-icon="inline-start" />
                Recently Saved
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest_saved">
                <ArrowUpAZIcon data-icon="inline-start" />
                Oldest Saved
              </DropdownMenuRadioItem>
            </>
          )}
          <DropdownMenuRadioItem value="newest_published">
            <ArrowDownAZIcon data-icon="inline-start" />
            Newest {isSaved && "Published"}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest_published">
            <ArrowUpAZIcon data-icon="inline-start" />
            Oldest {isSaved && "Published"}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
