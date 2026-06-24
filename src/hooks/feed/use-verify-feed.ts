import { useMutation } from "@tanstack/react-query";
import type { VerifiedFeedResult } from "@/actions/feed/verify-feed-action";
import { verifyFeedAction } from "@/actions/feed/verify-feed-action";

/**
 * Custom hook for verifying a feed URL.
 * Uses TanStack Query mutation to wrap the server action.
 */
export function useVerifyFeed() {
  return useMutation<VerifiedFeedResult, Error, string>({
    mutationFn: async (url: string) => {
      const response = await verifyFeedAction({ url });
      return response;
    },
  });
}
