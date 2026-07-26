import { useMutation } from "@tanstack/react-query";
import { deleteUserAction } from "@/actions/user/delete-user-action";
import type { DeleteAccountInput } from "@/lib/validations/profile";

/**
 * Custom hook for deleting the user's account.
 */
export function useDeleteAccount() {
  const mutation = useMutation({
    mutationFn: async (input: DeleteAccountInput) => {
      const result = await deleteUserAction(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete account.");
      }

      return result;
    },

    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
