import ItemListSkeleton from "@/components/feed/item-list-skeleton";
import { FeedToolbarSkeleton } from "@/components/layout/components/feed-toolbar-skeleton";

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
        <ItemListSkeleton />
      </section>
    </div>
  );
}
