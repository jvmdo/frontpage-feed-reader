import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { FeedItemList } from "@/components/feed/feed-item-list";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { feedItemsQuerySchema } from "@/lib/validations/feed";
import { getUserFeedItems } from "@/services/feed/get-user-feed-items";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Main dashboard page displaying all feed items for the user.
 * Prefetches the items on the server to hydrate the client cache.
 */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const result = feedItemsQuerySchema.safeParse(params);

  const { feedId, limit, offset } = result.success
    ? result.data
    : { feedId: undefined, limit: 20, offset: 0 };

  const queryClient = new QueryClient();

  // Prefetch items for the unified "All Items" feed or specific feed.
  // The key must match the one used in the useFeedItems hook.
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["feeds", "items", { feedId: feedId || null }],
    queryFn: () =>
      getUserFeedItems(db, session.user.id, { limit, offset, feedId }),
    initialPageParam: 0,
  });

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <div className="flex-1">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FeedItemList />
        </HydrationBoundary>
      </div>
    </div>
  );
}
