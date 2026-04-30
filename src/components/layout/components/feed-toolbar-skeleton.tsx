import { Skeleton } from "@/components/ui/skeleton";

export function FeedToolbarSkeleton() {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
        {/* Title and Unread Count Skeleton */}
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <Skeleton className="h-6 w-32 sm:h-7 sm:w-48" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Layout Toggles Skeleton */}
          <div className="hidden lg:flex items-center border border-border rounded-md mr-3">
            <div className="p-1.5 border-r border-border">
              <Skeleton className="size-4" />
            </div>
            <div className="p-1.5 border-r border-border">
              <Skeleton className="size-4" />
            </div>
            <div className="p-1.5">
              <Skeleton className="size-4" />
            </div>
          </div>

          {/* Refresh Action Skeleton */}
          <div className="h-8 px-3 flex items-center">
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {/* Mark All Read Action Skeleton */}
            <div className="hidden lg:flex h-8 px-3 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Assign Action Skeleton */}
            <div className="hidden lg:flex h-8 px-3 items-center border border-border rounded-md">
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Toolbar Actions Menu Skeleton (mobile/tablet) */}
            <div className="flex lg:hidden size-8 items-center justify-center border border-border rounded-md">
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
