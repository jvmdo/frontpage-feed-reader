import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || "An error occurred during operation.");
      }
    },
    onSuccess: () => {
      startTransition(() => {
        router.push("/sign-in");
      });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isNavigating,
  };
}
