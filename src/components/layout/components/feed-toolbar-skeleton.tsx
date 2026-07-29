import { Skeleton } from "@/components/ui/skeleton";

export function FeedToolbarSkeleton() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-4">
        {/* Title and Unread Count Skeleton */}
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <Skeleton className="h-7.5 w-32 sm:h-8.75" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {/* Tablet Menu */}
          <div className="lg:hidden h-9 px-2 flex items-center border border-border rounded-md">
            <Skeleton className="h-4 w-14.5" />
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {/* Filter */}
            <div className="h-8 px-2 lg:flex items-center border border-border rounded-md">
              <Skeleton className="h-4 w-12" />
            </div>

            {/* Ordering */}
            <div className="h-8 px-2 lg:flex items-center border border-border rounded-md">
              <Skeleton className="h-4 w-15.5" />
            </div>

            {/* Layout Toggles */}
            <div className="lg:flex w-27 h-8 items-center justify-center border border-border rounded-md">
              <div className="p-2 px-2.5 border-r border-border">
                <Skeleton className="size-4" />
              </div>
              <div className="p-2 px-2.5 border-r border-border">
                <Skeleton className="size-4" />
              </div>
              <div className="p-2 px-2.5">
                <Skeleton className="size-4" />
              </div>
            </div>

            {/* Refresh */}
            <div className="lg:flex h-8 px-2 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-14.5" />
            </div>

            {/* Mark All Read */}
            <div className="lg:flex h-8 px-2 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-21.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
