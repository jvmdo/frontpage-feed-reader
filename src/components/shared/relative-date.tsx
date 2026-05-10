"use client";

import { formatDistance } from "date-fns";
import type { ComponentProps } from "react";
import { useServerTime } from "@/components/providers/server-time-provider";

interface RelativeDateProps extends ComponentProps<"time"> {
  date: Date | string;
  addSuffix?: boolean;
}

/**
 * Renders a relative date string (e.g., "5 minutes ago") safely for SSR/CSR.
 * Uses a synchronized server time to handle clock drift between client and server.
 * Updates every 30 seconds to keep the displayed time fresh.
 */
export function RelativeDate({
  date,
  addSuffix = true,
  ...props
}: RelativeDateProps) {
  const { adjustedNow } = useServerTime();

  if (!adjustedNow) {
    // Initial server render and first client render before the effect runs
    return <span className="text-muted-foreground/50">...</span>;
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  // If the date is in the future relative to our adjusted now,
  // we treat it as "just now" to avoid "in 5 minutes" or confusing drift.
  if (parsedDate > adjustedNow) {
    return (
      <time {...props} dateTime={parsedDate.toISOString()}>
        Just now
      </time>
    );
  }

  // Also handle very recent past (less than 30 seconds) as "Just now"
  const diffInSeconds = (adjustedNow.getTime() - parsedDate.getTime()) / 1000;
  if (diffInSeconds < 30) {
    return (
      <time {...props} dateTime={parsedDate.toISOString()}>
        Just now
      </time>
    );
  }

  return (
    <time {...props} dateTime={parsedDate.toISOString()}>
      {formatDistance(parsedDate, adjustedNow, { addSuffix })}
    </time>
  );
}
