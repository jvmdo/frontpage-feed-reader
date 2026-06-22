"use client";

import { CheckCheckIcon, ListPlus, MoreHorizontalIcon } from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { NewItemsBanner } from "@/components/feed/new-items-banner";
import { FeedSortingToggles } from "@/components/layout/components/feed-sorting-toggles";
import { RefreshButton } from "@/components/layout/components/refresh-button";
import { Button } from "@/components/ui/button";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useNewItemsPolling } from "@/hooks/feed/use-new-items-polling";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { FeedLayoutToggles } from "./components/feed-layout-toggles";
import { FeedMenu } from "./components/feed-menu";
import { MarkAllReadDialog } from "./components/mark-all-read-dialog";
import { SavedFilterDropdown } from "./components/saved-filter-dropdown";
import { ToolbarTitle } from "./components/toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId, isSaved } = useFeedFilter();

  const { newItemsCount, handleLoadNew } = useNewItemsPolling({
    onBeforeRefresh: () => {
      document.getElementById("feed-container")?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  return (
    <header
      className="flex flex-col border-b border-border"
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

      <NewItemsBanner count={newItemsCount} onClick={handleLoadNew} />
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
