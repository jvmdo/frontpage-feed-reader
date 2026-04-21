"use client";

import { Edit2, Folder, Plus, Trash2 } from "lucide-react";
import { AddCategoryDialog } from "@/components/category/add-category-dialog";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { DeleteCategoryDialog } from "@/components/category/delete-category-dialog";
import { RenameCategoryDialog } from "@/components/category/rename-category-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";

export function CategoryManagementList() {
  const { data } = useCategories();

  if (data.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="You haven't created a category. Create your first one to start organizing your feeds."
        icon={Folder}
        action={
          <AddCategoryDialog asChild>
            <Button>
              <Folder />
              Create your first category
            </Button>
          </AddCategoryDialog>
        }
      />
    );
  }

  return (
    <ul className="divide-y">
      {data.map((category) => (
        <li
          key={category.id}
          className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
        >
          <div className="flex flex-col gap-1 min-w-0">
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

            <RenameCategoryDialog category={category}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Rename ${category.name}`}
                title={`Rename ${category.name}`}
              >
                <Edit2 className="size-6" />
              </Button>
            </RenameCategoryDialog>

            <DeleteCategoryDialog category={category}>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${category.name}`}
                title={`Delete ${category.name}`}
              >
                <Trash2 className="size-6" />
              </Button>
            </DeleteCategoryDialog>
          </div>
        </li>
      ))}
    </ul>
  );
}
