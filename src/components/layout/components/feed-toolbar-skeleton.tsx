import { Skeleton } from "@/components/ui/skeleton";

export function FeedToolbarSkeleton() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 md:py-4">
        {/* Title and Unread Count Skeleton */}
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <Skeleton className="h-6 w-32 sm:h-7 sm:w-48" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tablet menu */}
          <div className="h-9 px-3 flex items-center border border-border rounded-md">
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Layout Toggles Skeleton */}
          <div className="hidden lg:flex h-9 items-center border border-border rounded-md">
            <div className="p-2 border-r border-border">
              <Skeleton className="size-4" />
            </div>
            <div className="p-2 border-r border-border">
              <Skeleton className="size-4" />
            </div>
            <div className="p-2">
              <Skeleton className="size-4" />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {/* Assign Action Skeleton */}
            <div className="hidden lg:flex h-9 px-3 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Mark All Read Action Skeleton */}
            <div className="hidden lg:flex h-9 px-3 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
