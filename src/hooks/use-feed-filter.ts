"use client";

import { parseAsInteger, useQueryState } from "nuqs";

/**
 * Hook to manage the feedId filter in the URL.
 */
export function useFeedFilter() {
  const [feedId, setFeedId] = useQueryState(
    "feedId",
    parseAsInteger.withDefault(0).withOptions({
      shallow: true,
      clearOnDefault: true,
      scroll: false,
    }),
  );

  const clearFilter = () => setFeedId(null);

  return {
    feedId: feedId === 0 ? null : feedId,
    setFeedId,
    clearFilter,
  };
}
