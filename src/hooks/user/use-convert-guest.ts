import { useMutation, useQueryClient } from "@tanstack/react-query";
import { USER_ACCOUNTS_QUERY_KEY } from "@/hooks/user/use-user-accounts";
import { authClient } from "@/lib/auth-client";
import type { GuestConversionInput } from "@/lib/validations/auth";

/**
 * Custom hook for converting a temporary guest session into a permanent member account.
 * Handles the Better Auth sign-up call and invalidates the user accounts query cache.
 */
export function useConvertGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GuestConversionInput) => {
      const { error, data } = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: "Guest User",
        callbackURL: "/dashboard",
      });

      if (error) {
        throw new Error(
          error.message || "An error occurred during conversion.",
        );
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate user accounts query cache to reactively refresh password provider state
      queryClient.invalidateQueries({ queryKey: USER_ACCOUNTS_QUERY_KEY });
    },
  });
}
