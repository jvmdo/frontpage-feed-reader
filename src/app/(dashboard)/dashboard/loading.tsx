import { ItemSkeleton } from "@/components/feed/item-list-skeleton";
import { FeedToolbarSkeleton } from "@/components/layout/components/feed-toolbar-skeleton";
import { FeedLayout } from "@/hooks/ui/use-view-options";

export default function Loading() {
  return (
    <div
      className="flex flex-col h-full -mx-4 -mt-4"
      role="status"
      aria-label="Loading feed..."
    >
      <FeedToolbarSkeleton />
      <section
        id="feed-container"
        className="flex-1 overflow-y-auto -mb-8"
        aria-label="Feed"
      >
        <div aria-busy="true" className="w-full">
          <span className="sr-only" role="status">
            Loading items
          </span>

          <div aria-hidden="true" className={"flex flex-col"}>
            {Array.from({ length: 20 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeleton
              <ItemSkeleton key={`skeleton-${i}`} layout={FeedLayout.List} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
