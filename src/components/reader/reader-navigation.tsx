import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItemReaderNavigation } from "@/hooks/use-item-reader-navigation";
import { cn } from "@/lib/utils";

interface ReaderNavigationProps {
  className?: string;
}

/**
 * Navigation controls for the Reader View (Next/Previous).
 */
export function ReaderNavigation({ className }: ReaderNavigationProps) {
  const { goToNext, goToPrev, hasNext, hasPrev } = useItemReaderNavigation();

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4",
        className,
      )}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={goToPrev}
        disabled={!hasPrev}
        aria-label="Previous item"
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={goToNext}
        disabled={!hasNext}
        aria-label="Next item"
      >
        Next
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
