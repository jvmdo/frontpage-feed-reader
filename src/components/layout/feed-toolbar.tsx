"use client";

import {
  AlertCircleIcon,
  CheckCheckIcon,
  ListPlus,
  MoreHorizontalIcon,
  RotateCcwIcon,
} from "lucide-react";
import { Suspense } from "react";
import { useErrorBoundary } from "react-error-boundary";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { NewItemsBanner } from "@/components/feed/new-items-banner";
import { FeedSortingToggles } from "@/components/layout/components/feed-sorting-toggles";
import { RefreshButton } from "@/components/layout/components/refresh-button";
import { Button } from "@/components/ui/button";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { cn } from "@/lib/utils";
import { FeedLayoutToggles } from "./components/feed-layout-toggles";
import { FeedMenu } from "./components/feed-menu";
import { FilterDropdown } from "./components/filter-dropdown";
import { MarkAllReadDialog } from "./components/mark-all-read-dialog";
import { ToolbarTitle } from "./components/toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId, isSaved, status } = useFeedFilter();

  const isFilterActive = status !== "all";

  return (
    <header
      className="flex flex-col border-b border-border"
      role="toolbar"
      aria-label="Feed toolbar"
    >
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4">
        <ToolbarTitle feedId={feedId} categoryId={categoryId} />

        <div className="flex gap-1 md:ml-2">
          <div className="hidden md:flex">
            <FeedMenu>
              <Button
                variant={isFilterActive ? "secondary" : "outline"}
                className={cn(
                  "hidden md:inline-flex lg:hidden relative gap-1.5",
                  isFilterActive &&
                    "border-primary/20 text-primary bg-primary/10 hover:bg-primary/15",
                )}
                aria-label="Feed menu"
              >
                <div className="relative flex items-center shrink-0">
                  <MoreHorizontalIcon
                    className="size-4"
                    data-icon="inline-start"
                  />
                  {isFilterActive && (
                    <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
                Menu
              </Button>
            </FeedMenu>

            <div className="hidden lg:flex items-center gap-1">
              <FilterDropdown />
              <FeedSortingToggles />
              <FeedLayoutToggles />
              {categoryId && <AssignButton categoryId={categoryId} />}
              {!isSaved && <RefreshButton />}
              <MarkAllReadButton />
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <NewItemsBanner />
      </Suspense>
    </header>
  );
}

function AssignButton({ categoryId }: { categoryId: number }) {
  return (
    <AssignFeedsDialog categoryId={categoryId}>
      <Button variant="outline" size="sm" className="text-xs">
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

export function FeedToolbarErrorFallback() {
  const { resetBoundary } = useErrorBoundary();
  return (
    <header
      className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4 border-b border-border bg-destructive/5"
      role="toolbar"
      aria-label="Feed toolbar offline"
    >
      <div className="flex items-center gap-2.5 text-destructive min-w-0">
        <AlertCircleIcon className="size-5 shrink-0" />
        <span className="font-semibold text-sm sm:text-base truncate">
          Feed details unavailable
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => resetBoundary()}
        className="text-xs shrink-0"
      >
        <RotateCcwIcon className="size-3.5 mr-1.5" />
        Retry
      </Button>
    </header>
  );
}
