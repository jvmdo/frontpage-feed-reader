"use client";

import { useState } from "react";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { AssignAction } from "./assign-action";
import { LayoutToggles } from "./layout-toggles";
import { MarkAllReadAction } from "./mark-all-read-action";
import { RefreshAction } from "./refresh-action";
import { ToolbarActionsMenu } from "./toolbar-actions-menu";
import { ToolbarTitle } from "./toolbar-title";

export function FeedToolbar() {
  const { feedId, categoryId } = useFeedFilter();
  const [layout, setLayout] = useState("list");

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
        <ToolbarTitle feedId={feedId} categoryId={categoryId} />

        <div className="flex items-center gap-1.5">
          <LayoutToggles
            layout={layout}
            onLayoutChange={setLayout}
            className="hidden lg:flex mr-3"
          />

          <RefreshAction feedId={feedId} />

          <div className="hidden sm:flex items-center gap-1.5">
            <MarkAllReadAction
              feedId={feedId}
              categoryId={categoryId}
              className="hidden lg:inline-flex"
            />

            <AssignAction
              categoryId={categoryId}
              className="hidden lg:inline-flex"
            />

            <ToolbarActionsMenu
              feedId={feedId}
              categoryId={categoryId}
              layout={layout}
              setLayout={setLayout}
            />
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
