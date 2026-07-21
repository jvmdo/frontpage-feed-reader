import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import type { ResetPasswordInput } from "@/lib/validations/auth";

/**
 * Custom hook for resetting password with a reset token.
 * Invokes Better Auth resetPassword and redirects to /sign-in on success.
 */
export function useResetPassword() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
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
