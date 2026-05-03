import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategoryAction } from "@/actions/category/update-category-action";
import type { UpdateCategoryInput } from "@/lib/validations/category";
import type { Category } from "@/types";

/**
 * Custom hook for updating an existing category.
 * Handles server action invocation and cache invalidation.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      const result = await updateCategoryAction(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (updatedCategory) => {
      if (!updatedCategory) return;

      // Update the 'categories' list in the cache immediately
      queryClient.setQueryData<Category[]>(["categories"], (old) => {
        if (!old) return undefined;
        return old.map((cat) =>
          cat.id === updatedCategory.id ? updatedCategory : cat,
        );
      });

      // Invalidate to ensure consistency across the app (sidebar, etc.)
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      // Also invalidate subscriptions since they might be grouped by category
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
