"use client";

import { parseAsInteger, useQueryStates } from "nuqs";

/**
 * Hook to manage feedId and categoryId filters in the URL.
 * These filters are mutually exclusive: setting one clears the other.
 */
export function useFeedFilter() {
  const [states, setStates] = useQueryStates(
    {
      feedId: parseAsInteger.withDefault(0),
      categoryId: parseAsInteger.withDefault(0),
    },
    {
      shallow: true,
      clearOnDefault: true,
      scroll: false,
    },
  );

  const feedId = states.feedId === 0 ? null : states.feedId;
  const categoryId = states.categoryId === 0 ? null : states.categoryId;

  const setFeedId = (id: number | null) =>
    setStates({ feedId: id ?? 0, categoryId: 0 });

  const setCategoryId = (id: number | null) =>
    setStates({ categoryId: id ?? 0, feedId: 0 });

  const clearFilter = () => setStates({ feedId: 0, categoryId: 0 });

  return {
    feedId,
    setFeedId,
    categoryId,
    setCategoryId,
    clearFilter,
  };
}
