import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deleteUserAction } from "@/actions/user/delete-user-action";
import { authClient } from "@/lib/auth-client";
import type { DeleteAccountInput } from "@/lib/validations/profile";

/**
 * Custom hook for deleting the user's account.
 */
export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refetch } = authClient.useSession();

  return useMutation({
    mutationFn: async (input: DeleteAccountInput) => {
      const result = await deleteUserAction(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete account.");
      }

      return result;
    },
    onSuccess: async () => {
      await refetch();
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
  });
}
