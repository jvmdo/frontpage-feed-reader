"use client";

import {
  CheckCheckIcon,
  ListPlus,
  MoreHorizontalIcon,
  RotateCwIcon,
} from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { FeedSortingToggles } from "@/components/layout/components/feed-sorting-toggles";
import { Button } from "@/components/ui/button";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { useRefreshUI } from "@/hooks/ui/use-refresh-ui";
import { cn } from "@/lib/utils";
import { FeedLayoutToggles } from "./components/feed-layout-toggles";
import { FeedMenu } from "./components/feed-menu";
import { MarkAllReadDialog } from "./components/mark-all-read-dialog";
import { ToolbarTitle } from "./components/toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId } = useFeedFilter();

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4">
        <ToolbarTitle feedId={feedId} categoryId={categoryId} />

        <div className="hidden md:flex md:ml-2">
          <FeedMenu>
            <Button
              variant="outline"
              className="hidden md:inline-flex lg:hidden"
              aria-label="Feed menu"
            >
              Menu
              <MoreHorizontalIcon className="size-4" data-icon="inline-end" />
            </Button>
          </FeedMenu>

          <div className="hidden lg:flex items-center gap-1">
            <FeedLayoutToggles />
            <FeedSortingToggles />
            {categoryId && <AssignButton categoryId={categoryId} />}
            {feedId && <RefreshButton />}
            <MarkAllReadButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshButton() {
  const { isRefreshing, handleRefresh } = useRefreshUI();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      onSelect={(e) => e.preventDefault()}
      className="text-xs"
    >
      <RotateCwIcon
        className={cn("size-3.5", isRefreshing && "animate-spin")}
        data-icon="inline-start"
      />
      Refresh
    </Button>
  );
}

function AssignButton({ categoryId }: { categoryId: number }) {
  return (
    <AssignFeedsDialog categoryId={categoryId}>
      <Button variant="outline" size="sm">
        <ListPlus className="size-3.5" data-icon="inline-start" />
        Assign
      </Button>
    </AssignFeedsDialog>
  );
}

function MarkAllReadButton() {
  const { isDisabled } = useMarkAllReadUI();

  return (
    <MarkAllReadDialog>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        disabled={isDisabled}
      >
        <CheckCheckIcon className="size-3.5" data-icon="inline-start" />
        Mark all read
      </Button>
    </MarkAllReadDialog>
  );
}
