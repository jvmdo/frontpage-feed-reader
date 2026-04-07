"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface RelativeDateProps {
  date: Date | string;
  addSuffix?: boolean;
}

/**
 * Renders a relative date string (e.g., "5 minutes ago") safely for SSR/CSR.
 */
export function RelativeDate({ date, addSuffix = true }: RelativeDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Initial server render and first client render
    return <span className="text-muted-foreground/50">...</span>;
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  return (
    <time dateTime={parsedDate.toISOString()}>
      {formatDistanceToNow(parsedDate, { addSuffix })}
    </time>
  );
}
