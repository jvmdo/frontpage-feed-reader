"use client";

import type { ComponentProps } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteCategory } from "@/hooks/category/use-delete-category";
import type { Category } from "@/types";

interface DeleteCategoryDialogProps extends ComponentProps<typeof AlertDialog> {
  category: Category | null;
}

export function DeleteCategoryDialog({
  category,
  onOpenChange,
  ...props
}: DeleteCategoryDialogProps) {
  const { mutate: deleteCategory, isPending } = useDeleteCategory();

  const handleDelete = () => {
    if (!category) return;

    deleteCategory(
      { id: category.id },
      {
        onSuccess: () => {
          toast.success("Category deleted successfully");
          onOpenChange?.(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete category");
        },
      },
    );
  };

  return (
    <AlertDialog open={!!category} onOpenChange={onOpenChange} {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the <strong>{category?.name}</strong>{" "}
            category. All feeds in this category will be moved to{" "}
            <strong>Uncategorized</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "Deleting..." : "Delete Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
