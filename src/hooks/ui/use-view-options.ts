"use client";

import { parseAsStringEnum, useQueryStates } from "nuqs";
import { useEffect } from "react";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { getDefaultSorting } from "@/lib/sorting";

export enum FeedLayout {
  List = "list",
  Grid = "grid",
  Rows = "rows",
}

/**
 * Hook to manage feed view options (layout and order) in the URL.
 */
export function useViewOptions() {
  const { isSaved } = useFeedFilter();
  const defaultSort = getDefaultSorting({ isSaved });

  const [options, setOptions] = useQueryStates(
    {
      layout: parseAsStringEnum<FeedLayout>(
        Object.values(FeedLayout),
      ).withDefault(FeedLayout.List),
      sortBy: parseAsStringEnum<"publishedAt" | "bookmarkedAt">([
        "publishedAt",
        "bookmarkedAt",
      ]),
      sortOrder: parseAsStringEnum<"desc" | "asc">(["desc", "asc"]),
    },
    {
      shallow: true,
      clearOnDefault: true,
      scroll: false,
    },
  );

  // Sync from localStorage on mount if no layout parameter exists in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("layout")) {
      const savedLayout = localStorage.getItem(
        "frontpage_feed_layout",
      ) as FeedLayout;
      if (savedLayout && Object.values(FeedLayout).includes(savedLayout)) {
        setOptions({ layout: savedLayout });
      }
    }
  }, [setOptions]);

  const setLayout = (layout: FeedLayout) => {
    localStorage.setItem("frontpage_feed_layout", layout);
    setOptions({ layout });
  };

  return {
    layout: options.layout,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    setLayout,
    setSorting: (
      sortBy: "publishedAt" | "bookmarkedAt" | null,
      sortOrder: "desc" | "asc" | null,
    ) => {
      const isDefault =
        sortBy === defaultSort.sortBy && sortOrder === defaultSort.sortOrder;

      return setOptions({
        sortBy: isDefault ? null : sortBy,
        sortOrder: isDefault ? null : sortOrder,
      });
    },
  };
}
