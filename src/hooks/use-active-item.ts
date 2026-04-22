"use client";

import { parseAsInteger, useQueryState } from "nuqs";

/**
 * Hook to manage the active article ID in the URL for the Reader View.
 */
export function useActiveItem() {
  const [activeItemId, setActiveItemId] = useQueryState(
    "itemId",
    parseAsInteger,
  );

  return {
    activeItemId,
    setActiveItemId,
  };
}
