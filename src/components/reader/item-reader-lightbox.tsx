"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useAutoMarkAsRead } from "@/hooks/item/use-auto-mark-as-read";
import { useItem } from "@/hooks/item/use-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useSetReadStatus } from "@/hooks/item/use-set-read-status";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { useReaderShortcuts } from "@/hooks/ui/use-reader-shortcuts";
import { useReaderStore } from "@/hooks/ui/use-reader-store";
import { useScrollShortcuts } from "@/hooks/ui/use-scroll-shortcuts";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { cn } from "@/lib/utils";
import { ReaderFloatingControls } from "./reader-floating-controls";
import { ReaderToolbar } from "./reader-toolbar";
import { ReaderView } from "./reader-view";
import { ReaderViewError } from "./reader-view-error";
import { ReaderViewSkeleton } from "./reader-view-skeleton";

export function ItemReaderLightbox() {
  const { activeItemId, setActiveItemId } = useActiveItem();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveItemId(null);
    }
  };

  useScrollShortcuts({
    selector: '[role="dialog"] [data-slot="scroll-area-viewport"]',
    enabled: !!activeItemId,
  });

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
  const { mutate: setReadStatus } = useSetReadStatus();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { readerWidth } = useReaderStore();
  const { isTourActive } = useTourStore();
  const { setActiveItemId } = useActiveItem();

  useAutoMarkAsRead({ activeItemId, data, setReadStatus });

  const handleToggleRead = () => {
    if (!data) return;

    if (data.isWatermarked) {
      toast.info(
        "Articles archived by 'Mark all read' cannot be marked as unread.",
      );
      return;
    }

    setReadStatus({ itemId: activeItemId, isRead: !data.isRead });
  };

  const handleToggleBookmark = () => {
    toggleBookmark({ itemId: activeItemId });
  };

  useReaderShortcuts({
    onNext: goToNext,
    onPrev: goToPrev,
    onClose: () => setActiveItemId(null),
    onToggleRead: handleToggleRead,
    onToggleBookmark: handleToggleBookmark,
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
      onCloseAutoFocus={(e) => {
        // Radix Dialog sometimes fails to return focus to a sibling dialog.
        // If the search palette is open, we manually restore focus to it.
        const palette = document.querySelector<HTMLInputElement>("[cmdk-root]");
        if (palette) {
          e.preventDefault();
          palette.focus();
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
      <div className="bg-background sm:rounded-xl overflow-hidden h-full flex flex-col">
        <ReaderToolbar
          data={data}
          isPending={isPending}
          onToggleRead={handleToggleRead}
          goToPrev={goToPrev}
          goToNext={goToNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />

        {/* Content Area */}
        <ScrollArea
          key={activeItemId}
          className="flex-1 min-h-0"
          data-tour="reader-content"
          type="scroll"
        >
          {isPending ? (
            <ReaderViewSkeleton />
          ) : isError ? (
            <ReaderViewError message={error.message} retry={refetch} />
          ) : (
            <ReaderView data={data} />
          )}
        </ScrollArea>
      </div>

      <ReaderFloatingControls
        goToPrev={goToPrev}
        goToNext={goToNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </DialogContent>
  );
}
