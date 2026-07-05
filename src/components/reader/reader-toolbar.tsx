import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import type { ItemWithSource } from "@/types";
import { ReaderWidthControls } from "./reader-width-controls";
import { ToggleReadButton } from "./toggle-read-button";

interface ReaderToolbarProps {
  data: ItemWithSource | undefined;
  isPending: boolean;
  onToggleRead: () => void;
  goToPrev: () => void;
  goToNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ReaderToolbar({
  data,
  isPending,
  onToggleRead,
  goToPrev,
  goToNext,
  hasPrev,
  hasNext,
}: ReaderToolbarProps) {
  const [isPaletteOpen] = useSearchPaletteState();

  return (
    <header className="sticky top-0 z-20 flex items-center border-b bg-background">
      <DialogClose asChild>
        <Button variant="ghost" aria-label="Close" data-tour="reader-close">
          <XIcon className="size-4 md:size-5 text-text-tertiary" />
        </Button>
      </DialogClose>
      <div className="h-10 flex gap-1 items-center min-w-0 border-l pl-1 md:h-14 md:pl-2">
        <FeedIcon url={data?.feed?.iconUrl} size={20} />
        <span className="text-text-secondary text-xs truncate md:text-base">
          {data?.feed?.title}
        </span>
      </div>

      {/* Mobile Nav Controls */}
      <div className="ml-auto flex items-center gap-1 pr-2 sm:hidden">
        <ToggleReadButton
          data={data}
          onClick={onToggleRead}
          disabled={isPending}
        />
        {!isPaletteOpen && (
          <>
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
          </>
        )}
      </div>

      {/* Desktop Layout Controls */}
      <div className="hidden ml-auto sm:flex items-center gap-2 pr-4">
        <ToggleReadButton
          data={data}
          onClick={onToggleRead}
          disabled={isPending}
        />
        <ReaderWidthControls />
      </div>
    </header>
  );
}
