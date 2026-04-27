"use client";

import { ExternalLinkIcon } from "lucide-react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { RelativeDate } from "@/components/shared/relative-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { FeedItemWithSource } from "@/types";

interface ReaderViewProps {
  data: FeedItemWithSource;
  className?: string;
}

export function ReaderView({ data, className }: ReaderViewProps) {
  const { item, feed, isExcerpt } = data;

  return (
    <div className={cn("flex flex-col gap-8 py-8 px-4 md:px-8", className)}>
      <header className="flex flex-col gap-4">
        {/* Source metadata */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <FeedIcon url={feed.iconUrl} size={20} />
            <span>{feed.title}</span>
            <span className="opacity-40" aria-hidden="true">
              •
            </span>
            <RelativeDate date={item.publishedAt || item.createdAt} />
          </div>
          {isExcerpt && (
            <Badge variant="secondary" className="font-semibold">
              Excerpt
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
          {item.title}
        </h1>

        {/* Original link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-accent hover:underline w-fit"
          >
            View original
            <ExternalLinkIcon className="size-3.5" />
            <span className="sr-only"> (Opens in a new tab)</span>
          </a>
        )}
      </header>

      <Separator />

      {/* Article Content */}
      <div className="flex flex-col gap-8">
        <ReaderViewContent content={item.content || item.description || ""} />

        {isExcerpt && item.url && (
          <div className="pt-4 border-t border-border-subtle">
            <Button asChild className="w-full sm:w-auto" size="lg">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Read full article on {feed.title}
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReaderViewContent({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="text-center py-20 text-text-tertiary italic">
        No content available for this article.
      </div>
    );
  }

  return (
    <article
      className="article-content max-w-none"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: No alternatives
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
