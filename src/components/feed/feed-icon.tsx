"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FeedIconProps {
  url?: string | null;
  title?: string | null;
  className?: string;
  size?: number;
  categoryColor?: string | null;
}

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
  const initial = (title || "U").charAt(0).toUpperCase();

  return (
    <Avatar
      className={cn("rounded-sm border-0 after:hidden shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage
        src={url || undefined}
        alt={title || ""}
        className="rounded-sm object-contain"
      />
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
