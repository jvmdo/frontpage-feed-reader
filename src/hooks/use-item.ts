"use client";

import { useQuery } from "@tanstack/react-query";
import type { ItemWithSource } from "@/types";

export function useItem(itemId: number | null) {
  return useQuery<ItemWithSource>({
    queryKey: ["feeds", "items", "detail", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required");

      const response = await fetch(`/api/feeds/items/${itemId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Item not found");
        }
        throw new Error("Failed to fetch article content");
      }

      return response.json();
    },
    enabled: !!itemId,
    staleTime: 1000 * 60 * 30, // 30 minutes (content doesn't change much)
  });
}
