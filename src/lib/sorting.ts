import type { SortConfig, SortOptionId } from "@/types";

export const SORT_OPTIONS: Record<SortOptionId, SortConfig> = {
  recently_saved: { sortBy: "bookmarkedAt", sortOrder: "desc" },
  oldest_saved: { sortBy: "bookmarkedAt", sortOrder: "asc" },
  newest_published: { sortBy: "publishedAt", sortOrder: "desc" },
  oldest_published: { sortBy: "publishedAt", sortOrder: "asc" },
};

export const REVERSE_SORT_LOOKUP: Record<string, SortOptionId> = {
  "bookmarkedAt-desc": "recently_saved",
  "bookmarkedAt-asc": "oldest_saved",
  "publishedAt-desc": "newest_published",
  "publishedAt-asc": "oldest_published",
};

/**
 * Returns the default sorting configuration based on the current view context.
 */
export function getDefaultSorting(filters: { isSaved?: boolean }): SortConfig {
  if (filters.isSaved) {
    return SORT_OPTIONS.recently_saved;
  }
  return SORT_OPTIONS.newest_published;
}
