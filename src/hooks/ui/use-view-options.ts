"use client";

import { parseAsStringEnum, useQueryStates } from "nuqs";

export enum FeedLayout {
  List = "list",
  Grid = "grid",
  Rows = "rows",
}

export enum FeedOrder {
  Newest = "newest",
  Oldest = "oldest",
}

/**
 * Hook to manage feed view options (layout and order) in the URL.
 */
export function useViewOptions() {
  const [options, setOptions] = useQueryStates(
    {
      layout: parseAsStringEnum<FeedLayout>(
        Object.values(FeedLayout),
      ).withDefault(FeedLayout.List),
      order: parseAsStringEnum<FeedOrder>(Object.values(FeedOrder)).withDefault(
        FeedOrder.Newest,
      ),
    },
    {
      shallow: true,
      clearOnDefault: true,
      scroll: false,
    },
  );

  return {
    layout: options.layout,
    order: options.order,
    setLayout: (layout: FeedLayout) => setOptions({ layout }),
    setOrder: (order: FeedOrder) => setOptions({ order }),
  };
}
