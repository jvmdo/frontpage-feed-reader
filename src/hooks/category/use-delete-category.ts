import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategoryAction } from "@/actions/category/delete-category-action";
import type { DeleteCategoryInput } from "@/lib/validations/category";
import type { Category, FeedWithSubscription } from "@/types";

/**
 * Custom hook for deleting a category.
 * Handles server action invocation, cache updates, and invalidations.
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
      // 1. Remove the category from the list in the cache immediately
      queryClient.setQueryData<Category[]>(["categories"], (old) => {
        if (!old) return undefined;
        return old.filter((cat) => cat.id !== variables.id);
      });

      // 2. Manually uncategorize feeds that belonged to the deleted category in subscriptions cache
      queryClient.setQueryData<FeedWithSubscription[]>(
        ["subscriptions"],
        (old) => {
          if (!old) return undefined;
          return old.map((item): FeedWithSubscription => {
            if (item.subscription.categoryId === variables.id) {
              return {
                ...item,
                subscription: {
                  ...item.subscription,
                  categoryId: null,
                },
              };
            }
            return item;
          });
        },
      );

      // 3. Invalidate dependent queries to ensure complete consistency (counts, items, sidebar, etc.)
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "unread-counts"] });
      queryClient.invalidateQueries({ queryKey: ["feeds", "items"] });
    },
  });
}
