"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";
import { cn } from "@/lib/utils";

export function ItemSkeleton({ layout }: { layout: FeedLayout }) {
  if (layout === FeedLayout.Grid) {
    return (
      <div className="flex flex-col h-[200px] border border-border rounded-lg bg-card p-4">
        {/* Source line placeholder */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="size-4 rounded-md shrink-0" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10 ml-auto" />
        </div>

        {/* Title placeholder */}
        <div className="mb-2">
          <Skeleton className="h-5 w-full mb-1" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Excerpt placeholder */}
        <div className="space-y-1 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Footer placeholder */}
        <div className="mt-auto flex items-center justify-between">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="size-2 rounded-full" />
        </div>
      </div>
    );
  }

  if (layout === FeedLayout.Rows) {
    return (
      <div className="px-2 py-1.5 border-b border-border md:px-3 md:py-3">
        <div className="flex gap-2">
          {/* Unread dot placeholder */}
          <div className="flex items-center w-2">
            <Skeleton className="size-2 rounded-full" />
          </div>

          {/* Content placeholder */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Skeleton className="size-4 rounded-md shrink-0" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-5 w-2/3" />
          </div>

          {/* Action placeholder */}
          <div className="shrink-0 mt-2">
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

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
  count,
}: {
  children?: ReactNode;
  count?: number;
}) {
  const { layout } = useViewOptions();
  const defaultCount = layout === FeedLayout.Grid ? 12 : 6;
  const finalCount = count ?? defaultCount;

  return (
    <div aria-busy="true" className="w-full">
      <span className="sr-only" role="status">
        {children}
      </span>

      <div
        aria-hidden="true"
        className={cn(
          "flex flex-col",
          layout === FeedLayout.Grid &&
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4",
        )}
      >
        {Array.from({ length: finalCount }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeleton
          <ItemSkeleton key={`skeleton-${i}`} layout={layout} />
        ))}
      </div>
    </div>
  );
}

export default ItemListSkeleton;
