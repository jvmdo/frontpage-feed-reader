"use client";

import { AlertCircleIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { ReaderView } from "@/components/reader/reader-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useActiveItem } from "@/hooks/use-active-item";
import { useItem } from "@/hooks/use-item";
import { useItemReaderNavigation } from "@/hooks/use-item-reader-navigation";
import { useReaderShortcuts } from "@/hooks/use-reader-shortcuts";
import { getItemReaderScroll, saveItemReaderScroll } from "@/lib/scroll-store";
import { ReaderNavigation } from "./reader-navigation";

export function ItemReaderSheet() {
  const { activeItemId, setActiveItemId } = useActiveItem();
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

  return (
    <Sheet open={!!activeItemId} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl">
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
          <SheetFooter className="sticky bottom-0 z-10 border-t bg-background/80 p-4 backdrop-blur-sm sm:flex-row">
            <ReaderNavigation />
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
