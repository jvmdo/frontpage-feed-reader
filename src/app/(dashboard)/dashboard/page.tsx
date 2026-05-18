import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ItemList } from "@/components/feed/item-list";
import ItemListSkeleton from "@/components/feed/item-list-skeleton";
import { ActiveFilterChips } from "@/components/layout/components/active-filter-chips";
import { FeedToolbarSkeleton } from "@/components/layout/components/feed-toolbar-skeleton";
import { FeedToolbar } from "@/components/layout/feed-toolbar";
import { ItemReaderLightbox } from "@/components/reader/item-reader-lightbox";
import { db } from "@/db";
import { PAGINATION_INITIAL_OFFSET, PAGINATION_LIMIT } from "@/lib/constants";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { itemsQuerySchema } from "@/lib/validations/feed";
import { getItems } from "@/services/item/get-items";

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
    unreadOnly = false,
    feedIds = [],
    limit = PAGINATION_LIMIT,
    offset = PAGINATION_INITIAL_OFFSET,
  } = result.success ? result.data : {};

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
        unreadOnly,
        feedIds: [...feedIds].sort(),
      },
    ],
    queryFn: () =>
      getItems(db, session.user.id, {
        limit,
        offset,
        feedId,
        categoryId,
        bookmarkedOnly: saved,
        unreadOnly,
        feedIds,
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
          <FeedToolbar />
        </Suspense>
        <ActiveFilterChips />
        <section
          id="feed-container"
          className="flex-1 overflow-y-auto -mb-8"
          aria-label="Feed"
        >
          <Suspense fallback={<ItemListSkeleton />}>
            <ItemList />
          </Suspense>
        </section>
      </HydrationBoundary>
      <ItemReaderLightbox />
    </section>
  );
}
