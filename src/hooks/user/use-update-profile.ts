import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type { UpdateProfileInput } from "@/lib/validations/profile";

/**
 * Custom hook to update the user's profile display name and image.
 * Uses useMutation and triggers a session refetch on success to keep client state synchronized.
 */
export function useUpdateProfile() {
  const { refetch } = authClient.useSession();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const { error, data: updatedUser } = await authClient.updateUser({
        name: data.name,
        image: data.image || null,
      });

      if (error) {
        throw new Error(error.message || "Failed to update profile.");
      }

      // Ensure session is refetched so components reactively see the updated details
      await refetch();

      return updatedUser;
    },
  });
}
