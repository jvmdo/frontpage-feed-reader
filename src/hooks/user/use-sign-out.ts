import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || "An error occurred during operation.");
      }
    },
    onSuccess: () => {
      router.push("/sign-in");
    },
  });
}
