"use client";

import { parseAsStringEnum, useQueryStates } from "nuqs";
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

  return {
    layout: options.layout,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    setLayout: (layout: FeedLayout) => setOptions({ layout }),
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
