import { FeedToolbarSkeleton } from "@/components/layout/components/feed-toolbar-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col h-full -mx-4 -mt-4"
      role="status"
      aria-label="Loading feed..."
    >
      <FeedToolbarSkeleton />

      {/* Active Filter Chips Skeleton Placeholder */}
      <div className="h-10 border-b border-border bg-muted/10 shrink-0" />

      {/* Main Feed Container */}
      <div
        id="feed-container"
        className="flex-1 overflow-hidden p-4 md:p-6 space-y-4"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static loading skeletons list
            key={i}
            className="flex gap-4 p-4 lg:p-6 border-b border-border last:border-none"
          >
            {/* Unread indicator placeholder */}
            <div className="pt-2 w-2">
              <Skeleton className="size-2 rounded-full" />
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              {/* Feed Source & Date */}
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-1 rounded-full opacity-40" />
                <Skeleton className="h-4 w-12" />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 w-3/4" />
                <Skeleton className="h-4.5 w-1/2" />
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>

              {/* Category Badge */}
              <div className="pt-1">
                <Skeleton className="h-5 w-16 rounded-sm" />
              </div>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
