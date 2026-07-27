"use client";

import { formatDistance } from "date-fns";
import type { ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicker } from "@/hooks/use-ticker";

interface RelativeDateProps extends ComponentProps<"time"> {
  date: Date | string;
  addSuffix?: boolean;
}

/**
 * Renders a relative date string (e.g., "5 minutes ago") safely for SSR/CSR.
 * Uses a synchronized global ticker store to update displayed time every 30 seconds.
 */
export function RelativeDate({
  date,
  addSuffix = true,
  ...props
}: RelativeDateProps) {
  const nowTimestamp = useTicker();

  // Initial server render and first client render before hydration runs
  if (nowTimestamp === 0) {
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    const isoString = !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : "";

    return (
      <time {...props} dateTime={isoString} aria-busy="true">
        <Skeleton className="min-w-16 w-full h-2" />
        <span className="sr-only">Loading date...</span>
      </time>
    );
  }

  const clientNow = new Date(nowTimestamp);
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  // If the date is in the future relative to client now, or very recent past (< 30 seconds),
  // we treat it as "Just now" to avoid confusing time drift.
  const diffInSeconds = (clientNow.getTime() - parsedDate.getTime()) / 1000;

  if (diffInSeconds < 30 || parsedDate > clientNow) {
    return (
      <time {...props} dateTime={parsedDate.toISOString()}>
        Just now
      </time>
    );
  }

  return (
    <time {...props} dateTime={parsedDate.toISOString()}>
      {formatDistance(parsedDate, clientNow, { addSuffix })}
    </time>
  );
}
