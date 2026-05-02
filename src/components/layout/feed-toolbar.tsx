"use client";

import { CheckCheckIcon } from "lucide-react";
import { useState } from "react";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { Button } from "@/components/ui/button";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { AssignAction } from "./components/assign-action";
import { LayoutToggles } from "./components/layout-toggles";
import { MarkAllReadAction } from "./components/mark-all-read-action";
import { ToolbarActionsMenu } from "./components/toolbar-actions-menu";
import { ToolbarTitle } from "./components/toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId } = useFeedFilter();
  const [layout, setLayout] = useState("list");

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4">
        <ToolbarTitle feedId={feedId} categoryId={categoryId} />

        <div className="hidden md:flex md:ml-2">
          <ToolbarActionsMenu
            feedId={feedId}
            categoryId={categoryId}
            layout={layout}
            setLayout={setLayout}
          />

          <div className="hidden lg:flex items-center gap-1">
            <LayoutToggles layout={layout} onLayoutChange={setLayout} />
            <AssignAction categoryId={categoryId} />
            <StandaloneMarkAllRead />
          </div>
        </div>
      </div>

      {/* TODO: Background refresh */}
      {/* <button
        type="button"
        aria-live="polite"
        aria-label="Load 5 new items since your last visit"
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors border-t border-border/50"
      >
        <ArrowUpIcon className="size-3.5" />
        <span>5 new items since your last visit</span>
      </button> */}
    </div>
  );
}

/**
 * Logic-aware standalone button for the toolbar.
 */
function StandaloneMarkAllRead() {
  const { isDisabled } = useMarkAllReadUI();

  return (
    <MarkAllReadAction>
      <Button variant="outline" size="sm" disabled={isDisabled}>
        <CheckCheckIcon className="size-3.5" data-icon="inline-start" />
        Mark all read
      </Button>
    </MarkAllReadAction>
  );
}
