"use client";

import { ExternalLinkIcon } from "lucide-react";
import { RelativeDate } from "@/components/shared/relative-date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemWithSource } from "@/types";

interface ReaderViewProps {
  data: ItemWithSource;
  className?: string;
}

export function ReaderView({ data, className }: ReaderViewProps) {
  const { item, isExcerpt } = data;

  return (
    <section
      className={cn("flex flex-col gap-4 pt-4 pb-24 px-4 md:px-8", className)}
      aria-label="item content"
    >
      <header className="flex flex-col gap-4">
        <h1 className="text-lg md:text-xl xl:text-2xl font-bold text-text-primary leading-tight">
          {item.title}
        </h1>

        <div className="flex flex-wrap gap-2 justify-between relative -top-3">
          <RelativeDate
            date={item.publishedAt || item.createdAt}
            className="text-text-tertiary "
          />

          {!isExcerpt && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex gap-0.5 text-sm text-primary hover:underline"
            >
              View original
              <ExternalLinkIcon className="size-3" />
              <span className="sr-only"> (Opens in a new tab)</span>
            </a>
          )}
        </div>
      </header>

      <ReaderViewContent content={item.content || item.description || ""} />

      {isExcerpt && item.url && (
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-border-subtle">
          <p className="text-text-tertiary text-xs italic order-2">
            The author provided only an excerpt for this item. Please, go to the
            original source in order to read the full article.
          </p>
          <Button asChild className="w-full sm:max-w-xl" size="lg">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              View original
              <ExternalLinkIcon data-icon="inline-end" />
              <span className="sr-only"> (Opens in a new tab)</span>
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}

function ReaderViewContent({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="text-center py-20 text-text-tertiary italic">
        No content available for this item.
      </div>
    );
  }

  return (
    <article
      className="item-content max-w-none"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: No alternatives
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
