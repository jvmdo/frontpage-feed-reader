"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedLayout, useViewOptions } from "@/hooks/ui/use-view-options";
import { cn } from "@/lib/utils";

// --- Atomic Skeleton Parts ---

const SourceSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-1 min-w-0", className)}>
    <Skeleton className="size-5 rounded-md shrink-0" />
    <Skeleton className="h-4 w-20" />
  </div>
);

const DateSkeleton = ({
  showSeparator = false,
  className,
}: {
  showSeparator?: boolean;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2 shrink-0", className)}>
    {showSeparator && <Skeleton className="size-1 rounded-full opacity-40" />}
    <Skeleton className="h-4 w-12" />
  </div>
);

const TitleSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

const ExcerptSkeleton = ({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={cn("space-y-1", className)}>
    <Skeleton className="h-3 w-full" />
    {lines > 1 && <Skeleton className="h-3 w-5/6" />}
    {lines > 2 && <Skeleton className="h-3 w-4/6" />}
  </div>
);

const BadgeSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-4 w-16 rounded-sm", className)} />
);

const ActionSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("size-8 rounded-md", className)} />
);

const UnreadSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex shrink-0", className)}>
    <Skeleton className="size-2 rounded-full" />
  </div>
);

// --- Layout Skeletons ---

export function ItemSkeleton({ layout }: { layout: FeedLayout }) {
  // Shared base classes matching CardShell
  const baseClasses =
    "relative border-b border-border overflow-hidden transition-all";

  if (layout === FeedLayout.Grid) {
    return (
      <div
        className={cn(
          "w-full h-50 flex flex-col gap-1 p-4 border border-border rounded-lg",
          "bg-muted/10 animate-pulse",
        )}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <SourceSkeleton />
          <UnreadSkeleton />
        </div>

        <TitleSkeleton className="mb-1 shrink-0" />
        <div className="flex-1 overflow-hidden py-1">
          <ExcerptSkeleton lines={2} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 shrink-0">
          <BadgeSkeleton className="shrink" />
          <div className="grow flex items-center justify-end gap-2 shrink-0">
            <DateSkeleton />
            <ActionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (layout === FeedLayout.Rows) {
    return (
      <div className={cn(baseClasses, "flex gap-3 p-2 md:p-3")}>
        <UnreadSkeleton className="w-2 items-center" />
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex">
            <SourceSkeleton />
            <DateSkeleton showSeparator className="pl-2" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
        <ActionSkeleton />
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, "flex gap-4 p-4 lg:p-6")}>
      <UnreadSkeleton className="pt-2 w-2" />
      <div className="flex-1 min-w-0">
        <div className="flex mb-1.5">
          <SourceSkeleton />
          <DateSkeleton showSeparator className="pl-2" />
        </div>
        <TitleSkeleton className="mb-1.5" />
        <ExcerptSkeleton lines={2} className="mb-3" />
        <BadgeSkeleton />
      </div>
      <ActionSkeleton />
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
