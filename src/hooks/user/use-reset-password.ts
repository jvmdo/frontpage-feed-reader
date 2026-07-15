import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { ResetPasswordInput } from "@/lib/validations/auth";

/**
 * Custom hook for resetting password with a reset token.
 * Invokes Better Auth resetPassword and redirects to /sign-in on success.
 */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      password,
      token,
    }: ResetPasswordInput & { token: string }) => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        throw new Error(
          error.message ||
            "Failed to reset password. The link may have expired.",
        );
      }
    },
    onSuccess: () => {
      router.push("/sign-in");
    },
  });
}
