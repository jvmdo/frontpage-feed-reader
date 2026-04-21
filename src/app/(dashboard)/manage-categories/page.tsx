import { Folder } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddCategoryDialog } from "@/components/category/add-category-dialog";
import { CategoryManagementList } from "@/components/category/category-management-list";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Manage Categories | Frontpage",
  description: "Create, rename or delete your categories.",
};

export default async function ManageCategoriesPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="manage-categories-title"
    >
      <div className="flex items-center justify-between">
        <header id="manage-categories-title" className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Manage Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Structure your feed categories. Changes here are reflected in your
            sidebar.
          </p>
        </header>
        <AddCategoryDialog asChild>
          <Button
            variant="ghost"
            className="text-md"
            aria-label="Create category"
          >
            <Folder className="size-6" />
            Create
          </Button>
        </AddCategoryDialog>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <CategoryManagementList />
      </div>
    </section>
  );
}
