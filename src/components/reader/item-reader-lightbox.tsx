"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FoldHorizontalIcon,
  TextAlignJustifyIcon,
  UnfoldHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { ReaderView } from "@/components/reader/reader-view";
import { ReaderViewError } from "@/components/reader/reader-view-error";
import { ReaderViewSkeleton } from "@/components/reader/reader-view-skeleton";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useReaderShortcuts } from "@/hooks/ui/use-reader-shortcuts";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { cn } from "@/lib/utils";

const ReaderWidthValues = ["50vw", "65vw", "80vw"] as const;
type ReaderWidth = (typeof ReaderWidthValues)[number];

export function ItemReaderLightbox() {
  const { activeItemId, setActiveItemId } = useActiveItem();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveItemId(null);
    }
  };

  return (
    <Dialog open={!!activeItemId} onOpenChange={handleOpenChange}>
      {activeItemId && (
        <ItemReaderLightboxContent activeItemId={activeItemId} />
      )}
    </Dialog>
  );
}

function ItemReaderLightboxContent({ activeItemId }: { activeItemId: number }) {
  const { data, isPending, isError, error, refetch } = useItem(activeItemId);
  const { goToNext, goToPrev, hasNext, hasPrev } = useItemReaderNavigation();
  const { isTourActive } = useTourStore();

  const [readerWidth, setReaderWidth] = useState<ReaderWidth>(
    ReaderWidthValues[0],
  );

  useReaderShortcuts({
    onNext: goToNext,
    onPrev: goToPrev,
    enabled: true,
  });

  return (
    <DialogContent
      showCloseButton={false}
      onInteractOutside={(e) => {
        if (isTourActive) {
          e.preventDefault();
        }
      }}
      style={{ "--max-width": readerWidth } as React.CSSProperties}
      className={cn(
        "inset-0 translate-x-0 translate-y-0 max-w-none mx-auto p-0 bg-transparent @container",
        "sm:max-w-(--max-width) sm:h-[96vh] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
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
            <Button variant="ghost" aria-label="Close" data-tour="reader-close">
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
        <ScrollArea className="h-full" data-tour="reader-content">
          {isPending ? (
            <ReaderViewSkeleton />
          ) : isError ? (
            <ReaderViewError message={error.message} retry={refetch} />
          ) : (
            <ReaderView data={data} />
          )}
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
  );
}
