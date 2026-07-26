import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || "An error occurred during operation.");
      }
    },
    onSuccess: () => {
      window.location.href = "/sign-in";
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
