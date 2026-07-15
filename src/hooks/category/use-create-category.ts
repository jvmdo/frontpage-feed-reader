import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategoryAction } from "@/actions/category/create-category-action";
import { queryKeys } from "@/lib/query-keys";
import type { CreateCategoryInput } from "@/lib/validations/category";

/**
 * Custom hook for creating a new category.
 * Handles server action invocation and cache invalidation.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await createCategoryAction(input);

      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      // Invalidate categories query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
