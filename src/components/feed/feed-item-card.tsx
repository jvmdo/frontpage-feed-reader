"use client";

import { BookmarkIcon } from "lucide-react";
import { RelativeDate } from "@/components/shared/relative-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveItem } from "@/hooks/use-active-item";
import { useMarkAsRead } from "@/hooks/use-mark-as-read";
import { cn } from "@/lib/utils";
import type { FeedItemWithSource } from "@/types";
import { FeedIcon } from "./feed-icon";

interface FeedItemCardProps {
  data: FeedItemWithSource;
  className?: string;
}

export function FeedItemCard({ data, className }: FeedItemCardProps) {
  const { item, feed, isRead, categoryName } = data;
  const { mutate: markAsRead } = useMarkAsRead();
  const { setActiveItemId } = useActiveItem();

  const handleOpenReader = () => {
    if (!isRead) {
      markAsRead({ itemId: item.id });
    }
    setActiveItemId(item.id);
  };

  return (
    <article
      className={cn(
        "group relative px-4 sm:px-6 py-4 sm:py-5 border-b border-border transition-colors hover:bg-accent/40 cursor-pointer",
        isRead && "opacity-60",
        className,
      )}
      onClick={handleOpenReader}
    >
      <div className="flex gap-4">
        {/* Unread dot */}
        <div className="pt-2 w-3 shrink-0">
          {!isRead && (
            <div className="size-2 rounded-full bg-unread-indicator" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Source line */}
          <div className="flex items-center gap-2 mb-1.5">
            <FeedIcon
              url={feed.iconUrl || feed.url}
              title={feed.title || "Untitled Feed"}
              className="size-5 shrink-0"
              size={20}
            />
            <span className="text-sm text-muted-foreground truncate max-w-37.5 sm:max-w-none">
              {feed.title || "Untitled Feed"}
            </span>
            <span className="text-muted-foreground opacity-40">·</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              <RelativeDate date={item.publishedAt || item.createdAt} />
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
            <button
              type="button"
              className="text-left focus:outline-none after:absolute after:inset-0 after:z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReader();
              }}
            >
              {item.title || "Untitled Article"}
            </button>
          </h3>

          {/* Excerpt */}
          {item.description && (
            <div
              className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content from parser
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          )}

          {/* Tag (Category) */}
          {categoryName && (
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2.5 py-1 rounded-md border-0 bg-accent/15 text-accent hover:bg-accent/20"
            >
              {categoryName}
            </Badge>
          )}
        </div>

        {/* Save button (Bookmark) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            // Toggle save logic would go here
          }}
          className="md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 size-8 p-0 mt-2 hover:bg-transparent"
        >
          <BookmarkIcon
            className={cn("size-4 text-muted-foreground hover:text-foreground")}
          />
        </Button>
      </div>
    </article>
  );
}
