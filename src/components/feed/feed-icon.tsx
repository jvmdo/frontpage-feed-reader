"use client";

import { RssIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FeedIconProps {
  url?: string | null;
  title?: string | null;
  className?: string;
  size?: number;
}

/**
 * Renders a feed icon with a fallback to a default RssIcon if the URL is missing or broken.
 */
export function FeedIcon({ url, title, className, size = 16 }: FeedIconProps) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-sm shrink-0",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <RssIcon
          style={{ width: size * 0.7, height: size * 0.7 }}
          className="text-muted-foreground/50"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-sm shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={url}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}
