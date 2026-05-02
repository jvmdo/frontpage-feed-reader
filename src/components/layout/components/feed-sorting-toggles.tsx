"use client";

import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeedOrder, useViewOptions } from "@/hooks/ui/use-view-options";

/**
 * Toolbar component for sorting the feed items.
 * Synced with URL state.
 */
export function FeedSortingToggles() {
  const { order, setOrder } = useViewOptions();

  const text = order === FeedOrder.Newest ? "Newest" : "Oldest";
  const Icon =
    order === FeedOrder.Newest ? ArrowDownWideNarrow : ArrowUpWideNarrow;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5">
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{text}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuRadioGroup
          value={order}
          onValueChange={(v) => setOrder(v as FeedOrder)}
        >
          <DropdownMenuRadioItem value={FeedOrder.Newest} className="text-xs">
            <ArrowDownWideNarrow className="mr-2 size-3.5" />
            Newest
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={FeedOrder.Oldest} className="text-xs">
            <ArrowUpWideNarrow className="mr-2 size-3.5" />
            Oldest
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
