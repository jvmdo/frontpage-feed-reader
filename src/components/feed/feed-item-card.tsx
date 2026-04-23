"use client";

import { RelativeDate } from "@/components/shared/relative-date";
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
  const { item, feed, isRead } = data;
  const { mutate: markAsRead } = useMarkAsRead();
  const { setActiveItemId } = useActiveItem();

  const handleOpenReader = () => {
    if (!isRead) {
      markAsRead({ itemId: item.id });
    }
    setActiveItemId(item.id);
  };

  const containerStyles = cn(
    "group relative flex flex-col gap-3 p-4 rounded-lg border bg-surface transition-all text-left",
    "hover:shadow-md hover:border-border-strong",
    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:outline-none",
    isRead
      ? "opacity-70 border-border-subtle"
      : "border-l-4 border-l-unread-indicator",
    className,
  );

  const titleStyles = cn(
    "text-lg font-medium leading-tight transition-colors text-left",
    isRead
      ? "text-text-secondary group-hover:text-text-primary"
      : "text-text-primary group-hover:text-accent-hover",
  );

  const excerptStyles = cn(
    "text-base line-clamp-2 md:line-clamp-3 leading-relaxed",
    isRead ? "text-text-tertiary" : "text-text-secondary",
  );

  return (
    <article
      className={containerStyles}
      aria-labelledby={`article-title-${item.id}`}
    >
      <header className="flex flex-col gap-2">
        {/* Metadata row */}
        <div className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
          {!isRead && (
            <div
              className="size-2 rounded-full bg-unread-indicator shrink-0"
              aria-hidden="true"
            />
          )}

          <FeedIcon url={feed.iconUrl} size={16} />

          <span
            className={cn(
              "truncate max-w-30 md:max-w-none",
              !isRead && "text-text-secondary",
            )}
          >
            {feed.title || "Untitled Feed"}
          </span>

          <span className="opacity-40" aria-hidden="true">
            •
          </span>

          <RelativeDate date={item.publishedAt || item.createdAt} />
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className={titleStyles}>
            <button
              id={`article-title-${item.id}`}
              type="button"
              onClick={handleOpenReader}
              className="cursor-pointer focus:outline-none rounded-sm after:absolute after:inset-0 after:z-10 text-left"
            >
              {!isRead && <span className="sr-only">Unread: </span>}
              {item.title || "Untitled Article"}
              <span className="sr-only"> (Opens reader)</span>
            </button>
          </h3>
        </div>
      </header>

      {/* Excerpt */}
      {item.description && (
        <div
          className={excerptStyles}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: It's all good man
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      )}
    </article>
  );
}
