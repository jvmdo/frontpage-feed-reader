import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
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
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
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
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isNavigating,
  };
}
