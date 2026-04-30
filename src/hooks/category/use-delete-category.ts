import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategoryAction } from "@/actions/category/delete-category-action";
import type { DeleteCategoryInput } from "@/lib/validations/category";
import type { Category } from "@/types";

/**
 * Custom hook for deleting a category.
 * Handles server action invocation and cache invalidation.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteCategoryInput) => {
      const result = await deleteCategoryAction(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Remove the category from the list in the cache immediately
      queryClient.setQueryData<Category[]>(["categories"], (old) => {
        if (!old) return undefined;
        return old.filter((cat) => cat.id !== variables.id);
      });

      // Invalidate to ensure consistency (sidebar, counts, etc.)
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      // Invalidate subscriptions because feeds previously in this category 
      // are now uncategorized (ON DELETE SET NULL).
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      
      // Invalidate all feed items queries as the category grouping has changed
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
