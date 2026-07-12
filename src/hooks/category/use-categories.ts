import { useSuspenseQuery } from "@tanstack/react-query";
import { getAbsoluteUrl } from "@/lib/utils";
import type { Category } from "@/types";

/**
 * Custom hook for fetching and managing user categories.
 * Uses TanStack Query with server-side prefetch and hydration support.
 */
export function useCategories() {
  return useSuspenseQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(getAbsoluteUrl("/api/categories"));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch categories");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
