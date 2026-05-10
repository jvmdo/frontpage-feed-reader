import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReaderView } from "@/components/reader/reader-view";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { getItem } from "@/services/item/get-item";

interface ItemPageProps {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ItemPage({
  params,
  searchParams,
}: ItemPageProps) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { itemId: itemIdRaw } = await params;
  const itemId = Number.parseInt(itemIdRaw, 10);

  if (Number.isNaN(itemId)) {
    notFound();
  }

  const sp = await searchParams;
  const feedId = sp.feedId;
  const categoryId = sp.categoryId;

  // Build back link with filters
  const backParams = new URLSearchParams();
  if (feedId) backParams.set("feedId", String(feedId));
  if (categoryId) backParams.set("categoryId", String(categoryId));
  const backHref = `/dashboard${backParams.toString() ? `?${backParams.toString()}` : ""}`;

  const queryClient = getQueryClient();

  // Prefetch the item data
  await queryClient.prefetchQuery({
    queryKey: ["feeds", "items", "detail", itemId],
    queryFn: async () => {
      const item = await getItem(db, session.user.id, itemId);
      if (!item) throw new Error("Item not found");
      return item;
    },
  });

  const state = queryClient.getQueryState(["feeds", "items", "detail", itemId]);

  if (state?.status === "error") {
    notFound();
  }

  const data = state?.data as any; // We know it's prefilled or error

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
            <Link href={backHref}>
              <ChevronLeftIcon className="size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            <ReaderView data={data} />
          </div>
        </main>
      </div>
    </HydrationBoundary>
  );
}
