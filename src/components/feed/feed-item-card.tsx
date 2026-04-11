import { ExternalLinkIcon } from "lucide-react";
import { RelativeDate } from "@/components/shared/relative-date";
import { cn } from "@/lib/utils";
import type { FeedItemWithSource } from "@/types";
import { FeedIcon } from "./feed-icon";

interface FeedItemCardProps {
  data: FeedItemWithSource;
  className?: string;
}

export function FeedItemCard({ data, className }: FeedItemCardProps) {
  const { item, feed } = data;

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 p-4 rounded-lg border border-border-subtle bg-surface transition-all hover:shadow-sm hover:border-border",
        className,
      )}
    >
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <FeedIcon url={feed.iconUrl} title={feed.title} size={16} />
          <span className="font-medium text-text-secondary truncate max-w-30 md:max-w-none">
            {feed.title || "Untitled Feed"}
          </span>
          <span className="opacity-50">•</span>
          <div className="flex items-center gap-1">
            <RelativeDate date={item.publishedAt || item.createdAt} />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-medium leading-normal text-text-primary group-hover:text-accent-hover transition-colors">
            <a
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              {item.title || "Untitled Article"}
            </a>
          </h3>
          <div className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
            <ExternalLinkIcon className="size-4" />
          </div>
        </div>
      </header>
      {item.description && (
        <p className="text-base text-text-secondary line-clamp-2 md:line-clamp-3 leading-loose">
          {item.description}
        </p>
      )}
    </article>
  );
}
