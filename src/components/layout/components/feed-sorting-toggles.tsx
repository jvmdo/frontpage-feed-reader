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
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useViewOptions } from "@/hooks/ui/use-view-options";
import {
  getDefaultSorting,
  REVERSE_SORT_LOOKUP,
  SORT_OPTIONS,
} from "@/lib/sorting";
import type { SortOptionId } from "@/types";

function getSortText(id: SortOptionId, isSaved: boolean): string {
  const labels: Record<SortOptionId, string> = {
    recently_saved: "Recently Saved",
    oldest_saved: "Oldest Saved",
    newest_published: isSaved ? "Newest Published" : "Newest",
    oldest_published: isSaved ? "Oldest Published" : "Oldest",
  };
  return labels[id];
}

/**
 * Toolbar component for sorting the feed items.
 * Synced with URL state.
 */
export function FeedSortingToggles() {
  const {
    sortBy: urlSortBy,
    sortOrder: urlSortOrder,
    setSorting,
  } = useViewOptions();
  const { isSaved } = useFeedFilter();

  const defaultSort = getDefaultSorting({ isSaved });
  const sortBy = urlSortBy ?? defaultSort.sortBy;
  const sortOrder = urlSortOrder ?? defaultSort.sortOrder;

  // Reverse lookup using a composite key
  const activeValue =
    REVERSE_SORT_LOOKUP[`${sortBy}-${sortOrder}`] || "newest_published";

  const handleValueChange = (v: string) => {
    const config = SORT_OPTIONS[v as SortOptionId];
    if (config) {
      setSorting(config.sortBy, config.sortOrder);
    }
  };

  const text = getSortText(activeValue, isSaved);
  const Icon = sortOrder === "desc" ? ArrowDownWideNarrow : ArrowUpWideNarrow;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon className="size-3.5" />
          <span className="text-xs font-medium">{text}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={activeValue}
          onValueChange={handleValueChange}
        >
          {isSaved && (
            <>
              <DropdownMenuRadioItem value="recently_saved" className="text-xs">
                <ArrowDownWideNarrow className="mr-2 size-3.5" />
                Recently Saved
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest_saved" className="text-xs">
                <ArrowUpWideNarrow className="mr-2 size-3.5" />
                Oldest Saved
              </DropdownMenuRadioItem>
            </>
          )}
          <DropdownMenuRadioItem value="newest_published" className="text-xs">
            <ArrowDownWideNarrow className="mr-2 size-3.5" />
            Newest {isSaved && "Published"}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest_published" className="text-xs">
            <ArrowUpWideNarrow className="mr-2 size-3.5" />
            Oldest {isSaved && "Published"}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
