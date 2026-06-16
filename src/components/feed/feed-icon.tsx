"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FeedIconProps {
  url?: string | null;
  title?: string | null;
  className?: string;
  size?: number;
  categoryColor?: string | null;
}

// Global session-level cache to remember broken icon URLs during the active browser session
const brokenIcons = new Set<string>();

/**
 * Renders a feed icon using shadcn Avatar with a letter-box fallback.
 */
export function FeedIcon({
  url,
  title,
  className,
  size = 16,
  categoryColor,
}: FeedIconProps) {
  const [isBroken, setIsBroken] = useState(() =>
    url ? brokenIcons.has(url) : false,
  );

  useEffect(() => {
    if (url) {
      setIsBroken(brokenIcons.has(url));
    }
  }, [url]);

  const initial = (title || "U").charAt(0).toUpperCase();

  return (
    <Avatar
      className={cn("rounded-sm border-0 after:hidden shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {!isBroken && url && (
        <AvatarImage
          src={url}
          alt={title || ""}
          className="rounded-sm object-contain"
          onLoadingStatusChange={(status) => {
            if (status === "error") {
              brokenIcons.add(url);
              setIsBroken(true);
            }
          }}
        />
      )}
      <AvatarFallback
        className={cn(
          "rounded-sm font-bold select-none",
          !categoryColor && "bg-primary text-primary-foreground",
        )}
        style={{
          fontSize: Math.max(8, Math.floor(size * 0.5)),
          backgroundColor: categoryColor ?? undefined,
          color: categoryColor ? "white" : undefined,
        }}
        delayMs={600}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
