import { Skeleton } from "@/components/ui/skeleton";

export function CategoryManagementListSkeleton() {
  return (
    <ul className="divide-y" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
          key={i}
          className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
