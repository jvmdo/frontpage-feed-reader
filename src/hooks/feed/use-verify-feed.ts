import { useMutation } from "@tanstack/react-query";
import type { VerifiedFeedResult } from "@/types";

/**
 * Custom hook for verifying a feed URL.
 * Uses TanStack Query mutation to wrap the GET endpoint.
 */
export function useVerifyFeed() {
  return useMutation<VerifiedFeedResult, Error, string>({
    mutationFn: async (url: string) => {
      const response = await fetch(
        `/api/feeds/verify?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to verify feed");
      }
      return response.json();
    },
  });
}
