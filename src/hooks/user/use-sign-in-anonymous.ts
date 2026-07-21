import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Custom hook for signing in as a guest / anonymous user.
 * Invokes Better Auth's `signIn.anonymous` and redirects to `/dashboard` on success.
 */
export function useSignInAnonymous() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
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
    isPending: mutation.isPending || isNavigating,
  };
}
