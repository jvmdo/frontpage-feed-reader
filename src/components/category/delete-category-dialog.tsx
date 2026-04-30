"use client";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteCategory } from "@/hooks/category/use-delete-category";
import type { Category } from "@/types";

interface DeleteCategoryDialogProps {
  category: Category;
  children: React.ReactNode;
}

export function DeleteCategoryDialog({
  category,
  children,
}: DeleteCategoryDialogProps) {
  const deleteCategory = useDeleteCategory();

  const handleDelete = () => {
    deleteCategory.mutate(
      { id: category.id },
      {
        onSuccess: () => {
          toast.success("Category deleted successfully");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete category");
        },
      },
    );
  };

  const isDeleting = deleteCategory.isPending;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the <strong>{category.name}</strong>{" "}
            category. All feeds in this category will be moved to{" "}
            <strong>Uncategorized</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (isDeleting) return;
              handleDelete();
            }}
            aria-disabled={isDeleting}
            aria-busy={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Spinner />}
            {isDeleting ? <>Deleting...</> : "Delete Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
