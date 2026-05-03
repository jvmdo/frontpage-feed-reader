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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { useRefreshUI } from "@/hooks/ui/use-refresh-ui";
import {
  FeedLayout,
  FeedOrder,
  useViewOptions,
} from "@/hooks/ui/use-view-options";
import { cn } from "@/lib/utils";

interface FeedActionsMenuProps {
  children: React.ReactNode;
}

/**
 * Unified menu for feed-related actions, layout toggles, and sorting.
 * Consumes global state (filter, view options) internally.
 */
export function FeedMenu({ children }: FeedActionsMenuProps) {
  const { categoryId } = useFeedFilter();
  const { isDisabled: isMarkAllDisabled } = useMarkAllReadUI();
  const { isRefreshing, handleRefresh } = useRefreshUI();
  const { layout, order, setLayout, setOrder } = useViewOptions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
          value={order}
          onValueChange={(v) => setOrder(v as FeedOrder)}
        >
          <DropdownMenuRadioItem value={FeedOrder.Newest}>
            <ArrowDownAZIcon data-icon="inline-start" />
            Newest
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={FeedOrder.Oldest}>
            <ArrowUpAZIcon data-icon="inline-start" />
            Oldest
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
