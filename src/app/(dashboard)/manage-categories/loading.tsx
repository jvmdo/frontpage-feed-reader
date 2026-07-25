import { CategoryManagementListSkeleton } from "@/components/category/category-management-list-skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading categories..."
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Manage Categories
        </h1>
        <p className="text-muted-foreground text-sm">
          Categories organize and structure your feeds.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <CategoryManagementListSkeleton />
      </div>
    </div>
  );
}
