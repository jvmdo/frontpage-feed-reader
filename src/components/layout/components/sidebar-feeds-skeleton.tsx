import { Skeleton } from "@/components/ui/skeleton";

export function SidebarFeedsSkeleton() {
  return (
    <div className="p-2" aria-busy={true}>
      <span className="sr-only" role="status">
        Loading your feeds and categories
      </span>

      {/* Categories skeleton */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeleton
          <div key={i} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full size-2" />
              <Skeleton className="h-6 w-30" />
            </div>
            <div className="flex flex-col gap-2 pl-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
