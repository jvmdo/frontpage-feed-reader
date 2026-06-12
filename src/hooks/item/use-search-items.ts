import { useInfiniteQuery } from "@tanstack/react-query";
import type { ListItemWithSource } from "@/types";

const SEARCH_PAGE_SIZE = 10;

/**
 * Hook for global article search with infinite loading.
 * Expects an already-debounced search term.
 */
export function useSearchItems(search: string) {
  return useInfiniteQuery<ListItemWithSource[], Error, ListItemWithSource[]>({
    queryKey: ["items", "search", search],
    queryFn: async ({ pageParam = 0, signal }) => {
      if (!search) return [];

      const url = `/api/items?search=${encodeURIComponent(search)}&limit=${SEARCH_PAGE_SIZE}&offset=${pageParam}`;
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error("Failed to search items");
      }

      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer than the limit, we've reached the end
      if (lastPage.length < SEARCH_PAGE_SIZE) return undefined;

      // Otherwise, the next offset is the current total items count
      return allPages.length * SEARCH_PAGE_SIZE;
    },
    enabled: search.length >= 2,
    staleTime: 1000 * 60, // 1 minute
    select: (data) => data.pages.flat(),
  });
}
