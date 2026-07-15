import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategoryAction } from "@/actions/category/delete-category-action";
import { queryKeys } from "@/lib/query-keys";
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
    },
    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      await queryClient.cancelQueries({
        queryKey: queryKeys.subscriptions.all,
      });

      // 2. Snapshot current caches for rollback
      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.all,
      );
      const previousSubscriptions = queryClient.getQueryData<
        FeedWithSubscription[]
      >(queryKeys.subscriptions.all);

      // 3. Optimistically remove the category from the list
      queryClient.setQueryData<Category[]>(queryKeys.categories.all, (old) => {
        if (!old) return undefined;
        return old.filter((cat) => cat.id !== variables.id);
      });

      // 4. Optimistically uncategorize feeds that belonged to the deleted category
      queryClient.setQueryData<FeedWithSubscription[]>(
        queryKeys.subscriptions.all,
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

      // Return snapshots in context
      return { previousCategories, previousSubscriptions };
    },
    onError: (_err, _variables, context) => {
      // Rollback to snapshots on failure
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.all,
          context.previousCategories,
        );
      }
      if (context?.previousSubscriptions) {
        queryClient.setQueryData(
          queryKeys.subscriptions.all,
          context.previousSubscriptions,
        );
      }
    },
    onSettled: () => {
      // Force invalidation to sync client cache with DB truth
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.items.all() });
    },
  });
}
