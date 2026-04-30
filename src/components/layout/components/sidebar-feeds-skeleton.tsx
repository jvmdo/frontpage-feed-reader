import { Skeleton } from "@/components/ui/skeleton";

export function SidebarFeedsSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-2" aria-busy={true}>
      <span className="sr-only" role="status">
        Loading your feeds
      </span>

      {/* Categories skeleton */}
      <div aria-hidden={true}>
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeleton
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-24 mb-1 mx-2" />
            <div className="flex flex-col gap-1 pl-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Uncategorized skeleton */}
      <div className="flex flex-col gap-2" aria-hidden={true}>
        <Skeleton className="h-6 w-32 mb-1 mx-2" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}
