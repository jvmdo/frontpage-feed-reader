import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useGuestSignInStore } from "@/hooks/ui/use-guest-sign-in-store";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Returns true if an anonymous sign-in process or navigation is currently in flight.
 */
export function useIsSigningInAnonymous() {
  return useGuestSignInStore((state) => state.isSigningIn);
}

/**
 * Custom hook for signing in as a guest / anonymous user.
 * Invokes Better Auth's `signIn.anonymous` and redirects to `/dashboard` on success.
 */
export function useSignInAnonymous() {
  const router = useRouter();
  const { setIsSigningIn, isSigningIn } = useGuestSignInStore();

  const mutation = useMutation({
    mutationKey: queryKeys.auth.anonymous,
    mutationFn: async () => {
      setIsSigningIn(true);
      const { error } = await authClient.signIn.anonymous();

      if (error) {
        setIsSigningIn(false);
        throw new Error(error.message || "Failed to sign in as guest.");
      }
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: () => {
      setIsSigningIn(false);
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isSigningIn,
  };
}
