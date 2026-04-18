import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function FeedItemListSkeleton({
  children = "Loading feed items...",
}: {
  children?: ReactNode;
}) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {children}
      </span>

      <div aria-hidden="true" className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list
          <FeedItemSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default FeedItemListSkeleton;

/**
 * A loading skeleton for the FeedItemCard component.
 * Mirrors the visual structure and spacing of the card.
 */
export function FeedItemSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border-subtle bg-surface">
      <div className="flex flex-col gap-1.5">
        {/* Meta info (Source, Time) */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-24" />
          <span className="text-muted-foreground/20 text-xs">•</span>
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-5 w-[90%]" />
            <Skeleton className="h-5 w-[40%] md:hidden" />
          </div>
          <Skeleton className="size-4 rounded-sm hidden md:block shrink-0" />
        </div>
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[60%] hidden md:block" />
      </div>
    </div>
  );
}
