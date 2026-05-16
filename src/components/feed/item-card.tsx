"use client";

import { BookmarkIcon } from "lucide-react";
import { RelativeDate } from "@/components/shared/relative-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useMarkRead } from "@/hooks/item/use-mark-read";
import { FeedLayout } from "@/hooks/ui/use-view-options";
import { cn } from "@/lib/utils";
import type { ListItemWithSource } from "@/types";
import { FeedIcon } from "./feed-icon";

interface ItemCardProps {
  data: ListItemWithSource;
  className?: string;
  "data-tour"?: string;
  layout: FeedLayout;
}

export function ItemCard({
  data,
  className,
  "data-tour": dataTour,
  layout,
}: ItemCardProps) {
  const { item, feed, isRead, categoryName, categoryColor } = data;
  const { mutate: markAsRead } = useMarkRead();
  const { setActiveItemId } = useActiveItem();

  const handleOpenReader = () => {
    if (!isRead) {
      markAsRead({ itemId: item.id });
    }
    setActiveItemId(item.id);
  };

  if (layout === FeedLayout.Grid) {
    return (
      <article
        className={cn(
          "group relative flex flex-col w-full h-50 border border-border rounded-lg bg-card transition-all hover:bg-accent/60 cursor-pointer overflow-hidden",
          isRead && "opacity-60",
          className,
        )}
        aria-labelledby={`title-${item.id}`}
        data-tour={dataTour}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Source line */}
          <div className="flex items-center gap-2 mb-3">
            <FeedIcon
              url={feed.iconUrl || feed.url}
              title={feed.title || "Untitled Feed"}
              className="size-4 shrink-0"
              categoryColor={categoryColor}
            />
            <span className="text-xs text-muted-foreground truncate">
              {feed.title || "Untitled Feed"}
            </span>
            <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              <RelativeDate date={item.publishedAt || item.createdAt} />
            </span>
          </div>

          {/* Title */}
          <h3
            id={`title-${item.id}`}
            className="text-base font-semibold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-3"
          >
            {item.title || "Untitled Item"}
            <span className="sr-only">({isRead ? "" : "un"}read)</span>
          </h3>

          <button
            type="button"
            className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset z-10"
            aria-label={`Open reader for ${item.title || "item"}`}
            onClick={handleOpenReader}
          />

          {/* Excerpt */}
          {item.description && (
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content from parser
              dangerouslySetInnerHTML={{ __html: item.description }}
              className="text-sm text-muted-foreground leading-relaxed line-clamp-2 pointer-events-none"
            />
          )}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between">
            {categoryName ? (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-semibold rounded-sm border-0"
                style={{
                  background: categoryColor ? `${categoryColor}40` : undefined,
                  color: categoryColor ?? undefined,
                }}
              >
                {categoryName}
              </Badge>
            ) : (
              <div />
            )}

            <div className="flex items-center">
              {/* Save button (Bookmark) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle save logic would go here
                }}
                aria-label="Save for later"
                className="group relative z-20 transition-all shrink-0 size-8 p-0 hover:bg-primary/10"
              >
                <BookmarkIcon className="size-4 text-muted-foreground group-hover:text-primary" />
              </Button>

              {!isRead && (
                <div className="size-2 rounded-full bg-unread-indicator shrink-0" />
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (layout === FeedLayout.Rows) {
    return (
      <article
        className={cn(
          "group relative px-2 py-1.5 border-b border-border transition-colors hover:bg-accent/60 cursor-pointer md:px-3 md:py-3",
          isRead && "opacity-60",
          className,
        )}
        aria-labelledby={`title-${item.id}`}
        data-tour={dataTour}
      >
        <div className="flex gap-2">
          {/* Unread dot */}
          <div className="flex items-center w-2">
            {!isRead && (
              <div className="size-2 rounded-full bg-unread-indicator" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <FeedIcon
                url={feed.iconUrl || feed.url}
                title={feed.title || "Untitled Feed"}
                className="size-4 shrink-0"
                categoryColor={categoryColor}
              />
              <span className="text-sm text-muted-foreground truncate">
                {feed.title || "Untitled Feed"}
              </span>
              <span className="text-muted-foreground opacity-40">·</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                <RelativeDate date={item.publishedAt || item.createdAt} />
              </span>
            </div>

            {/* Title */}
            <h3
              id={`title-${item.id}`}
              className="grow min-w-0 truncate text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors"
            >
              {item.title || "Untitled Item"}
              <span className="sr-only">({isRead ? "" : "un"}read)</span>
            </h3>
            <button
              type="button"
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset z-10"
              aria-label={`Open reader for ${item.title || "item"}`}
              onClick={handleOpenReader}
            />
          </div>

          {/* Save button (Bookmark) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // Toggle save logic would go here
            }}
            aria-label="Save for later"
            className="group relative z-20 transition-all shrink-0 size-8 p-0 mt-2 hover:bg-primary/10"
          >
            <BookmarkIcon className="size-4 text-muted-foreground group-hover:text-primary" />
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative px-4 py-4 border-b border-border transition-colors hover:bg-accent/60 cursor-pointer sm:px-6 sm:py-5",
        isRead && "opacity-60",
        className,
      )}
      aria-labelledby={`title-${item.id}`}
      data-tour={dataTour}
    >
      <div className="flex gap-4">
        {/* Unread dot */}
        <div className="pt-4 w-3 shrink-0">
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
              categoryColor={categoryColor}
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
          <h3
            id={`title-${item.id}`}
            className="text-base font-semibold text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors"
          >
            {item.title || "Untitled Item"}
            <span className="sr-only">({isRead ? "" : "un"}read)</span>
          </h3>
          <button
            type="button"
            className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset z-10"
            aria-label={`Open reader for ${item.title || "item"}`}
            onClick={handleOpenReader}
          />

          {/* Excerpt */}
          {item.description && (
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted content from parser
              dangerouslySetInnerHTML={{ __html: item.description }}
              className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3 pointer-events-none"
            />
          )}

          {/* Tag (Category) */}
          {categoryName && (
            <Badge
              variant="secondary"
              className={`text-xs font-semibold rounded-sm border-0`}
              style={{
                background: categoryColor ? `${categoryColor}40` : undefined,
                color: categoryColor ?? undefined,
              }}
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
          aria-label="Save for later"
          className="group relative z-20 transition-all shrink-0 size-8 p-0 mt-2 hover:bg-primary/10"
        >
          <BookmarkIcon className="size-4 text-muted-foreground group-hover:text-primary" />
        </Button>
      </div>
    </article>
  );
}
