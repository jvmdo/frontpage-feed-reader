import { FeedManagerSkeleton } from "@/components/feed/feed-manager-skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading feeds..."
    >
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Manage Feeds
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage your subscribed content sources.
          </p>
        </div>
      </header>

      <FeedManagerSkeleton />
    </div>
  );
}
