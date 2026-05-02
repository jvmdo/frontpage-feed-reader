"use client";

import { Grid2X2Icon, ListIcon, Rows3Icon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";

/**
 * Toolbar toggles for changing the feed layout.
 * Synced with URL state.
 */
export function FeedLayoutToggles() {
  const { layout, setLayout } = useViewOptions();

  return (
    <ToggleGroup
      type="single"
      value={layout}
      onValueChange={(v) => v && setLayout(v as FeedLayout)}
      className="border h-8"
    >
      <ToggleGroupItem
        value={FeedLayout.List}
        className="h-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground border-r"
        aria-label="List view"
      >
        <ListIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value={FeedLayout.Grid}
        className="h-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground border-r"
        aria-label="Grid view"
      >
        <Grid2X2Icon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value={FeedLayout.Rows}
        className="h-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        aria-label="Rows view"
      >
        <Rows3Icon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
