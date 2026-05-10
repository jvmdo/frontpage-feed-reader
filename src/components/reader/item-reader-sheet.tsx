"use client";

import { AlertCircleIcon, Maximize2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ReaderView } from "@/components/reader/reader-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useReaderShortcuts } from "@/hooks/ui/use-reader-shortcuts";
import {
  getItemReaderScroll,
  saveItemReaderScroll,
  saveItemsListScroll,
} from "@/lib/scroll-store";
import { ReaderNavigation } from "./reader-navigation";

export function ItemReaderSheet() {
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { feedId, categoryId } = useFeedFilter();
  const { data, isLoading, error } = useItem(activeItemId);
  const { goToNext, goToPrev } = useItemReaderNavigation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastItemIdRef = useRef<number | null>(null);

  useReaderShortcuts({
    onNext: goToNext,
    onPrev: goToPrev,
    enabled: !!activeItemId,
    scrollContainerRef,
  });

  // Handle scroll persistence
  useEffect(() => {
    // 1. Save scroll position of the PREVIOUS item before switching
    if (
      lastItemIdRef.current !== null &&
      lastItemIdRef.current !== activeItemId
    ) {
      if (scrollContainerRef.current) {
        saveItemReaderScroll(
          lastItemIdRef.current,
          scrollContainerRef.current.scrollTop,
        );
      }
    }

    // 2. Update tracked ID
    lastItemIdRef.current = activeItemId;

    // 3. Restore scroll position for the NEW item
    if (activeItemId && !isLoading && !error && data) {
      const savedScroll = getItemReaderScroll(activeItemId);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = savedScroll;
      }
    }
  }, [activeItemId, isLoading, error, data]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Save current scroll before closing
      if (activeItemId && scrollContainerRef.current) {
        saveItemReaderScroll(
          activeItemId,
          scrollContainerRef.current.scrollTop,
        );
      }
      setActiveItemId(null);
    }
  };

  const handleFullPageTransition = () => {
    saveItemsListScroll(feedId || categoryId);
  };

  const fullPageHref = `/items/${activeItemId}${
    feedId || categoryId
      ? `?${new URLSearchParams({
          ...(feedId ? { feedId: String(feedId) } : {}),
          ...(categoryId ? { categoryId: String(categoryId) } : {}),
        }).toString()}`
      : ""
  }`;

  return (
    <Sheet open={!!activeItemId} onOpenChange={handleOpenChange}>
      <SheetContent className="gap-0 w-[90vw]! md:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Item Reader</SheetTitle>
          <SheetDescription>
            Read the full content of the selected item.
          </SheetDescription>
        </SheetHeader>

        <section
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto outline-none"
          aria-label="item content"
          aria-busy={isLoading}
          aria-live="polite"
        >
          {isLoading ? (
            <ReaderSkeleton />
          ) : error ? (
            <div className="p-8">
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : "Failed to load item"}
                </AlertDescription>
              </Alert>
            </div>
          ) : data ? (
            <ReaderView data={data} />
          ) : null}
        </section>

        {data && (
          <SheetFooter className="sticky bottom-0 z-10 border-t">
            <ReaderNavigation />
            {!data.isExcerpt && (
              <Button
                variant="outline"
                size="sm"
                asChild
                onClick={handleFullPageTransition}
                className="gap-2"
              >
                <Link href={fullPageHref}>
                  <Maximize2Icon className="size-4" />
                  <span className="hidden sm:inline">Full Page</span>
                </Link>
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading item content
      </span>

      <div aria-hidden="true" className="flex flex-col gap-8 py-8 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <span className="opacity-40">•</span>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>

        <Skeleton className="h-4 w-24" />

        <Separator />

        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
        </div>
      </div>
    </div>
  );
}
