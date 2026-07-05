import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderFloatingNavProps {
  goToPrev: () => void;
  goToNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ReaderFloatingNav({
  goToPrev,
  goToNext,
  hasPrev,
  hasNext,
}: ReaderFloatingNavProps) {
  return (
    <>
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
    </>
  );
}
