import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ItemList, ItemListErrorFallback } from "@/components/feed/item-list";
import ItemListSkeleton from "@/components/feed/item-list-skeleton";
import { ActiveFilterChips } from "@/components/layout/components/active-filter-chips";
import { FeedToolbarSkeleton } from "@/components/layout/components/feed-toolbar-skeleton";
import {
  FeedToolbar,
  FeedToolbarErrorFallback,
} from "@/components/layout/feed-toolbar";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { db } from "@/db";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { getDefaultSorting } from "@/lib/sorting";
import { itemsQuerySchema } from "@/lib/validations/feed";
import { getItems } from "@/services/item/get-items";

export const metadata: Metadata = {
  title: "Dashboard",
};

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
  const result = itemsQuerySchema.safeParse(params);

  const {
    feedId,
    categoryId,
    saved = false,
    status = "all",
    feedIds = [],
    limit = PAGINATION_LIMIT,
    offset = PAGINATION_INITIAL_OFFSET,
    sortBy: urlSortBy,
    sortOrder: urlSortOrder,
  } = result.success ? result.data : {};

  // Determine default sorting based on the view
  const defaultSort = getDefaultSorting({ isSaved: saved });
  const sortBy = urlSortBy ?? defaultSort.sortBy;
  const sortOrder = urlSortOrder ?? defaultSort.sortOrder;

  const queryClient = getQueryClient();

  // Prefetch items for the unified "All Items" feed, specific feed, or category.
  // The key must match the one used in the useItems hook.
  queryClient.prefetchInfiniteQuery({
    queryKey: [
      "feeds",
      "items",
      {
        feedId: feedId ?? null,
        categoryId: categoryId ?? null,
        bookmarkedOnly: saved,
        status,
        feedIds: [...feedIds].sort(),
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      getItems(db, session.user.id, {
        limit,
        offset,
        feedId,
        categoryId,
        bookmarkedOnly: saved,
        status,
        feedIds,
        sortBy,
        sortOrder,
      }),
    initialPageParam: PAGINATION_INITIAL_OFFSET,
  });

  return (
    <section
      className="flex flex-col h-full -mx-4 -mt-4"
      aria-labelledby="feed-title"
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<FeedToolbarSkeleton />}>
          <QueryErrorBoundary fallback={<FeedToolbarErrorFallback />}>
            <FeedToolbar />
          </QueryErrorBoundary>
        </Suspense>
        <ActiveFilterChips />
        <section
          id="feed-container"
          className="flex-1 overflow-y-auto -mb-8"
          aria-label="Feed"
        >
          <Suspense fallback={<ItemListSkeleton />}>
            <QueryErrorBoundary fallback={<ItemListErrorFallback />}>
              <ItemList />
            </QueryErrorBoundary>
          </Suspense>
        </section>
      </HydrationBoundary>
    </section>
  );
}
