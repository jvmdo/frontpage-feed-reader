"use client";

import { Grid2X2Icon, ListIcon, Rows3Icon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function LayoutToggles({
  layout,
  onLayoutChange,
  className,
}: {
  layout: string;
  onLayoutChange: (value: string) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={layout}
      onValueChange={(v) => v && onLayoutChange(v)}
      className={cn(
        "border border-border rounded-md overflow-hidden gap-0",
        className,
      )}
    >
      <ToggleGroupItem
        value="list"
        className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground border-r border-border"
        aria-label="List view"
      >
        <ListIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="grid"
        className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground border-r border-border"
        aria-label="Grid view"
      >
        <Grid2X2Icon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="rows"
        className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground"
        aria-label="Rows view"
      >
        <Rows3Icon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
