import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePasswordAction } from "@/actions/user/change-password-action";
import { USER_ACCOUNTS_QUERY_KEY } from "@/hooks/user/use-user-accounts";
import type { ChangePasswordInput } from "@/lib/validations/profile";

/**
 * Custom hook for changing or setting a user password.
 * Handles server action invocation and cache invalidation for user accounts.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const result = await changePasswordAction(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update password.");
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate user accounts queries to trigger a refetch and update provider state
      queryClient.invalidateQueries({ queryKey: USER_ACCOUNTS_QUERY_KEY });
    },
  });
}
