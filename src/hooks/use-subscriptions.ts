import { useSuspenseQuery } from "@tanstack/react-query";
import type { FeedWithSubscription } from "@/types";

/**
 * Custom hook for fetching and managing user subscriptions.
 * Uses TanStack Query with server-side prefetch and hydration support.
 */
export function useSubscriptions() {
  return useSuspenseQuery<FeedWithSubscription[]>({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/feeds/subscriptions");

      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch subscriptions");
      }

      return result.data as FeedWithSubscription[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
