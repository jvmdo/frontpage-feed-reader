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
    },
    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["categories"] });

      // 2. Snapshot current categories cache
      const previousCategories = queryClient.getQueryData<Category[]>([
        "categories",
      ]);

      // 3. Optimistically update the categories list in place
      queryClient.setQueryData<Category[]>(["categories"], (old) => {
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
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
