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

      <div aria-hidden="true" className="flex flex-col">
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
    <div className="px-4 py-4 border-b border-border sm:px-6 sm:py-5">
      <div className="flex gap-4">
        {/* Unread dot placeholder */}
        <div className="pt-2 w-3 shrink-0">
          <Skeleton className="size-2 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Source line */}
          <div className="flex items-center gap-2 mb-1.5">
            <Skeleton className="size-5 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-24" />
            <span className="text-muted-foreground opacity-40">·</span>
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Title */}
          <div className="mb-1.5">
            <Skeleton className="h-5 w-[90%] sm:w-[70%]" />
          </div>

          {/* Excerpt */}
          <div className="space-y-2 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
          </div>

          {/* Tag placeholder */}
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>

        {/* Save button placeholder */}
        <div className="mt-2 shrink-0">
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
