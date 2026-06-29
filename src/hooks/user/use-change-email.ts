import { useMutation } from "@tanstack/react-query";
import { changeEmailAction } from "@/actions/user/change-email-action";
import { authClient } from "@/lib/auth-client";
import type { ChangeEmailInput } from "@/lib/validations/profile";

/**
 * Custom hook for changing the user's email address.
 * Invokes `changeEmailAction` and triggers a session refetch on success.
 */
export function useChangeEmail() {
  const { refetch } = authClient.useSession();

  return useMutation({
    mutationFn: async (input: ChangeEmailInput) => {
      const result = await changeEmailAction(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update email.");
      }

      // Ensure session is refetched so components reactively see the updated email
      await refetch();

      return result;
    },
  });
}
