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
import { SavedFilterDropdown } from "./components/saved-filter-dropdown";
import { ToolbarTitle } from "./components/toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId, isSaved } = useFeedFilter();

  return (
    <header
      className="border-b border-border bg-card"
      role="toolbar"
      aria-label="Feed toolbar"
    >
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4">
        <ToolbarTitle feedId={feedId} categoryId={categoryId} />

        <div className="flex gap-1 md:ml-2">
          {isSaved && <SavedFilterDropdown />}

          <div className="hidden md:flex">
            <FeedMenu>
              <Button
                variant="outline"
                className="hidden md:inline-flex lg:hidden"
                aria-label="Feed menu"
              >
                <MoreHorizontalIcon
                  className="size-4"
                  data-icon="inline-start"
                />
                Menu
              </Button>
            </FeedMenu>

            <div className="hidden lg:flex items-center gap-1">
              <FeedSortingToggles />
              <FeedLayoutToggles />
              {categoryId && <AssignButton categoryId={categoryId} />}
              <RefreshButton />
              <MarkAllReadButton />
            </div>
          </div>
        </div>
      </div>
    </header>
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
