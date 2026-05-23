"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewItemsBannerProps {
  count: number;
  onClick: () => void;
  className?: string;
}

/**
 * A banner that appears at the top of the item list when new items are available.
 */
export function NewItemsBanner({
  count,
  onClick,
  className,
}: NewItemsBannerProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 w-full overflow-hidden transition-all duration-300",
        count > 0
          ? "h-8 border-t opacity-100"
          : "h-0 border-t-0 opacity-0 pointer-events-none",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {count > 0 && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 animate-in fade-in slide-in-from-top-20"
          onClick={onClick}
        >
          <ArrowUp size={12} />
          {count} new {count === 1 ? "item" : "items"} available
        </button>
      )}
    </div>
  );
}
