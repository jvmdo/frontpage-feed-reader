import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export const USER_ACCOUNTS_QUERY_KEY = queryKeys.userAccounts.all;

/**
 * Custom hook to fetch the current user's connected authentication accounts.
 * Utilizes React Suspense for data loading.
 */
export function useUserAccounts() {
  return useSuspenseQuery({
    queryKey: queryKeys.userAccounts.all,
    queryFn: async () => {
      const res = await authClient.listAccounts();
      if (res.error) throw res.error;
      return res.data || [];
    },
  });
}
