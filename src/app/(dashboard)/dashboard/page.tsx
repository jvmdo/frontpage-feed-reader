import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FeedItemList } from "@/components/feed/feed-item-list";
import FeedItemListSkeleton from "@/components/feed/feed-item-list-skeleton";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { db } from "@/db";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import { getQueryClient } from "@/lib/get-query-client";
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

  const {
    feedId,
    limit = PAGINATION_LIMIT,
    offset = PAGINATION_INITIAL_OFFSET,
  } = result.success ? result.data : {};

  const queryClient = getQueryClient();

  // Prefetch items for the unified "All Items" feed or specific feed.
  // The key must match the one used in the useFeedItems hook.
  queryClient.prefetchInfiniteQuery({
    queryKey: ["feeds", "items", { feedId: feedId || null }],
    queryFn: () =>
      getUserFeedItems(db, session.user.id, { limit, offset, feedId }),
    initialPageParam: PAGINATION_INITIAL_OFFSET,
  });

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <section className="flex-1" aria-label="Feed">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<FeedItemListSkeleton />}>
            <FeedItemList />
          </Suspense>
        </HydrationBoundary>
      </section>
    </div>
  );
}
