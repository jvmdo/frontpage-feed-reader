import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategoryAction } from "@/actions/category/update-category-action";
import { queryKeys } from "@/lib/query-keys";
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
    },
    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      // 2. Snapshot current categories cache
      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all,
      );

      // 3. Optimistically update the categories list in place
      queryClient.setQueryData<Category[]>(queryKeys.categories.all, (old) => {
        if (!old) return undefined;
        return old.map((cat) =>
          cat.id === variables.id
            ? {
                ...cat,
                name: variables.name ?? cat.name,
                color: variables.color ?? cat.color,
              }
            : cat,
        );
      });

      // Return snapshot
      return { previousCategories };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.all,
          context.previousCategories,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    },
  });
}
