import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const USER_ACCOUNTS_QUERY_KEY = ["user-accounts"] as const;

/**
 * Custom hook to fetch the current user's connected authentication accounts.
 * Utilizes React Suspense for data loading.
 */
export function useUserAccounts() {
  return useSuspenseQuery({
    queryKey: USER_ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const res = await authClient.listAccounts();
      return res.data || [];
    },
  });
}
