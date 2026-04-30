import { useSuspenseQuery } from "@tanstack/react-query";
import type { Category } from "@/types";

/**
 * Custom hook for fetching and managing user categories.
 * Uses TanStack Query with server-side prefetch and hydration support.
 */
export function useCategories() {
  return useSuspenseQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }

      return result.data as Category[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
