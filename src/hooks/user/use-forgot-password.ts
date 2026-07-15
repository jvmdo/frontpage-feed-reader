import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type { ForgotPasswordInput } from "@/lib/validations/auth";

/**
 * Custom hook for requesting a password reset.
 * Invokes Better Auth requestPasswordReset.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        throw new Error(error.message || "Failed to request password reset.");
      }
    },
  });
}
