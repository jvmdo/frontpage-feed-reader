import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { SignUpInput } from "@/lib/validations/auth";

/**
 * Custom hook for registering a new user.
 * Invokes Better Auth signUp.email and redirects to /dashboard on success.
 */
export function useSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignUpInput) => {
      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (error) {
        throw new Error(error.message || "An error occurred during sign up.");
      }
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}
