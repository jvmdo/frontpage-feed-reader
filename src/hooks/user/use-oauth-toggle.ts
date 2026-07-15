import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { useUserAccounts } from "./use-user-accounts";

interface UseOAuthToggleOptions {
  onLinkSuccess?: () => void;
  onUnlinkSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook to toggle OAuth account linkage (link/unlink).
 */
export function useOAuthToggle(
  providerId: "github",
  options?: UseOAuthToggleOptions,
) {
  const { data: accounts } = useUserAccounts();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  const githubAccount = accounts.find((acc) => acc.providerId === providerId);
  const isLinked = !!githubAccount;

  const { mutate: link, isPending: isLinking } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.linkSocial({
        provider: providerId,
        callbackURL: pathname,
      });

      if (error) {
        throw new Error(
          error.message || `Failed to link ${providerId} account.`,
        );
      }
    },
    onSuccess: () => {
      options?.onLinkSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  const { mutate: unlink, isPending: isUnlinking } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.unlinkAccount({
        providerId,
      });

      if (error?.code === "FAILED_TO_UNLINK_LAST_ACCOUNT") {
        throw new Error(
          "Cannot unlink your only sign-in method. Set a password and try again.",
        );
      }

      if (error) {
        throw new Error(
          error.message || `Failed to unlink ${providerId} account.`,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userAccounts.all });
      options?.onUnlinkSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  const toggle = () => {
    if (isLinked) {
      unlink();
    } else {
      link();
    }
  };

  return {
    isLinked,
    isPending: isLinking || isUnlinking,
    toggle,
  };
}
