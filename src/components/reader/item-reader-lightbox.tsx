"use client";

import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FoldHorizontalIcon,
  TextAlignJustifyIcon,
  UnfoldHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { ReaderView } from "@/components/reader/reader-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useReaderShortcuts } from "@/hooks/ui/use-reader-shortcuts";
import { getItemReaderScroll, saveItemReaderScroll } from "@/lib/scroll-store";
import { cn } from "@/lib/utils";

const ReaderWidthValues = ["50vw", "65vw", "80vw"] as const;
type ReaderWidth = (typeof ReaderWidthValues)[number];

/**
 * A comprehensive, full-screen reader for feed items.
 * Optimized for both mobile (compact toolbar) and desktop (focused reading).
 */
export function ItemReaderLightbox() {
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { data, isLoading, error } = useItem(activeItemId);
  const { goToNext, goToPrev, hasNext, hasPrev } = useItemReaderNavigation();

  const [readerWidth, setReaderWidth] = useState<ReaderWidth>(
    ReaderWidthValues[0],
  );
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const lastItemIdRef = useRef<number | null>(null);

  useReaderShortcuts({
    onNext: goToNext,
    onPrev: goToPrev,
    enabled: !!activeItemId,
    scrollContainerRef: scrollViewportRef,
  });

  // Handle scroll persistence across items
  useEffect(() => {
    if (
      lastItemIdRef.current !== null &&
      lastItemIdRef.current !== activeItemId
    ) {
      if (scrollViewportRef.current) {
        saveItemReaderScroll(
          lastItemIdRef.current,
          scrollViewportRef.current.scrollTop,
        );
      }
    }

    lastItemIdRef.current = activeItemId;

    if (activeItemId && !isLoading && !error && data) {
      const savedScroll = getItemReaderScroll(activeItemId);
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = savedScroll;
      }
    }
  }, [activeItemId, isLoading, error, data]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (activeItemId && scrollViewportRef.current) {
        saveItemReaderScroll(activeItemId, scrollViewportRef.current.scrollTop);
      }
      setActiveItemId(null);
    }
  };

  return (
    <Dialog open={!!activeItemId} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={{ "--max-width": readerWidth } as React.CSSProperties}
        className={cn(
          "inset-0 translate-x-0 translate-y-0 max-w-none mx-auto p-0 bg-transparent",
          "sm:max-w-(--max-width) sm:h-[96vh] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          data?.isExcerpt && "top-auto h-min!",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Item Reader</DialogTitle>
          <DialogDescription>
            Read the full content of the selected item.
          </DialogDescription>
        </DialogHeader>

        {/* Main Surface */}
        <div className="bg-background sm:rounded-xl overflow-hidden">
          {/* Toolbar */}
          <header className="sticky top-0 z-20 flex items-center border-b bg-background">
            <DialogClose asChild>
              <Button variant="ghost">
                <XIcon className="size-4 md:size-5 text-text-tertiary" />
              </Button>
            </DialogClose>
            <div className="h-10 flex gap-1 items-center min-w-0 border-l pl-1 md:h-14 md:pl-2">
              <FeedIcon url={data?.feed.iconUrl} size={20} />
              <span className="text-text-secondary text-xs truncate md:text-base">
                {data?.feed.title}
              </span>
            </div>

            {/* Mobile Nav Controls */}
            <div className="ml-auto flex items-center gap-1 pr-2 sm:hidden">
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={goToPrev}
                disabled={!hasPrev}
                aria-label="Previous article"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={goToNext}
                disabled={!hasNext}
                aria-label="Next article"
              >
                <ChevronRightIcon />
              </Button>
            </div>

            {/* Desktop Layout Controls */}
            <div className="hidden ml-auto sm:flex items-center gap-2 pr-4">
              <ToggleGroup
                type="single"
                value={readerWidth}
                onValueChange={(val) => {
                  setReaderWidth(val as ReaderWidth);
                }}
              >
                <ToggleGroupItem value={ReaderWidthValues[0]}>
                  <FoldHorizontalIcon className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value={ReaderWidthValues[1]}>
                  <TextAlignJustifyIcon className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value={ReaderWidthValues[2]}>
                  <UnfoldHorizontalIcon className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </header>

          {/* Content Area */}
          <ScrollArea className="h-full" ref={scrollViewportRef}>
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
          </ScrollArea>
        </div>

        {/* Floating Controls */}
        <div className="hidden sm:block fixed -left-16 top-1/2 -translate-y-1/2">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "size-12 rounded-full hover:scale-110 active:scale-95",
              !hasPrev && "opacity-20",
            )}
            onClick={goToPrev}
            disabled={!hasPrev}
            aria-label="Previous item"
          >
            <ChevronLeftIcon className="size-6" />
          </Button>
        </div>

        <div className="hidden sm:block fixed -right-16 top-1/2 -translate-y-1/2">
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "size-12 rounded-full hover:scale-110 active:scale-95",
              !hasNext && "opacity-20",
            )}
            onClick={goToNext}
            disabled={!hasNext}
            aria-label="Next item"
          >
            <ChevronRightIcon className="size-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-busy="true" className="animate-in fade-in duration-500">
      <span className="sr-only" role="status">
        Loading item content
      </span>

      <div
        aria-hidden="true"
        className="flex flex-col gap-8 py-12 px-6 md:px-12 max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <span className="opacity-40">•</span>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>

        <div className="flex flex-col gap-4 pt-4">
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
