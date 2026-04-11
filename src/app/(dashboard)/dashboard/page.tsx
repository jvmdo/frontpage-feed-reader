import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { FeedItemList } from "@/components/feed/feed-item-list";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserFeedItems } from "@/services/feed/get-user-feed-items";

/**
 * Main dashboard page displaying all feed items for the user.
 * Prefetches the items on the server to hydrate the client cache.
 */
export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const queryClient = new QueryClient();

  // Prefetch items for the unified "All Items" feed.
  // The key must match the one used in the useFeedItems hook.
  await queryClient.prefetchQuery({
    queryKey: ["feeds", "items"],
    queryFn: () => getUserFeedItems(db, session.user.id),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">All Items</h1>
        <p className="text-muted-foreground text-sm">
          Everything from your subscriptions in one place.
        </p>
      </div>

      <div className="flex-1">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FeedItemList />
        </HydrationBoundary>
      </div>
    </div>
  );
}
