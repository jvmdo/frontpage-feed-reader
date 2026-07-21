import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { authClient } from "@/lib/auth-client";

/**
 * Custom hook for signing in as a guest / anonymous user.
 * Invokes Better Auth signIn.anonymous and redirects to /dashboard on success.
 */
export function useSignInAnonymous() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.anonymous();

      if (error) {
        throw new Error(error.message || "Failed to sign in as guest.");
      }
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}
