import { useIsMutating, useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Returns true if an anonymous sign-in process or navigation is currently in flight.
 */
export function useIsSigningInAnonymous() {
  const mutatingCount = useIsMutating({
    mutationKey: queryKeys.auth.anonymous,
  });
  return mutatingCount > 0;
}

/**
 * Custom hook for signing in as a guest / anonymous user.
 * Invokes Better Auth's `signIn.anonymous` and redirects to `/dashboard` on success.
 */
export function useSignInAnonymous() {
  const router = useRouter();
  const [isPendingTransition, startTransition] = useTransition();

  const mutation = useMutation({
    mutationKey: queryKeys.auth.anonymous,
    mutationFn: async () => {
      const { error } = await authClient.signIn.anonymous();

      if (error) {
        throw new Error(error.message || "Failed to sign in as guest.");
      }
    },
    onSuccess: () => {
      startTransition(() => {
        router.push("/dashboard");
      });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isPendingTransition,
  };
}
