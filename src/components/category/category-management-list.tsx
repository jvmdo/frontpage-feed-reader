"use client";

import { Edit2, Folder, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddCategoryDialog } from "@/components/category/add-category-dialog";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { CategoryDot } from "@/components/category/category-dot";
import { DeleteCategoryDialog } from "@/components/category/delete-category-dialog";
import { EditCategoryDialog } from "@/components/category/edit-category-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/category/use-categories";
import type { Category } from "@/types";

export function CategoryManagementList() {
  const { data } = useCategories();

  const [editingDialog, setEditingDialog] = useState<Category | null>(null);
  const [deletingDialog, setDeletingDialog] = useState<Category | null>(null);

  // We use inline conditional rendering instead of an early return when `data.length === 0`.
  // This ensures that the dialogs stay mounted during optimistic updates.
  // An early return would unmount them when the last category is optimistically removed,
  // losing the onSuccess/onError feedback (toast, spinner, dialog close) for the in-flight
  // mutation — the Server Action itself keeps running server-side, but no component is left
  // to react to the result.
  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="You haven't created a category. Create your first one to start organizing your feeds."
          icon={Folder}
          action={
            <AddCategoryDialog>
              <Folder />
              Create your first category
            </AddCategoryDialog>
          }
        />
      ) : (
        <ul className="divide-y">
          {data.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CategoryDot color={category.color} size="lg" />
                <span className="font-medium truncate">{category.name}</span>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <AssignFeedsDialog categoryId={category.id}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Add or remove feeds in ${category.name}`}
                    title={`Add or remove feeds in ${category.name}`}
                  >
                    <Plus className="size-6" />
                  </Button>
                </AssignFeedsDialog>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${category.name}`}
                  title={`Edit ${category.name}`}
                  onClick={() => setEditingDialog(category)}
                >
                  <Edit2 className="size-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${category.name}`}
                  title={`Delete ${category.name}`}
                  onClick={() => setDeletingDialog(category)}
                >
                  <Trash2 className="size-6" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EditCategoryDialog
        category={editingDialog}
        onOpenChange={() => setEditingDialog(null)}
      />

      <DeleteCategoryDialog
        category={deletingDialog}
        onOpenChange={() => setDeletingDialog(null)}
      />
    </>
  );
}
