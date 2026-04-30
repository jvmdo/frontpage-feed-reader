import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-border sm:px-6 sm:py-5">
      <div className="flex gap-4">
        {/* Unread dot placeholder */}
        <div className="pt-4 w-3 shrink-0">
          <Skeleton className="size-2 rounded-full" />
        </div>

        {/* Content placeholder */}
        <div className="flex-1 min-w-0">
          {/* Source line placeholder */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="size-5 rounded-md shrink-0" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Title placeholder */}
          <div className="mb-2">
            <Skeleton className="h-6 w-3/4 mb-1" />
          </div>

          {/* Excerpt placeholder */}
          <div className="space-y-1 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Tag placeholder */}
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>

        {/* Action placeholder */}
        <div className="shrink-0 mt-2">
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ItemListSkeleton({
  children = "Loading items...",
}: {
  children?: ReactNode;
}) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        {children}
      </span>

      <div aria-hidden="true" className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeleton
          <ItemSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default ItemListSkeleton;
