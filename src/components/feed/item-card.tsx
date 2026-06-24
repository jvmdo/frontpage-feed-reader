"use client";

import { BookmarkIcon } from "lucide-react";
import { createContext, useContext } from "react";
import { RelativeDate } from "@/components/shared/relative-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useToggleBookmark } from "@/hooks/item/use-toggle-bookmark";
import { FeedLayout } from "@/hooks/ui/use-view-options";
import { cn } from "@/lib/utils";
import type { ListItemWithSource } from "@/types";
import { FeedIcon } from "./feed-icon";

// --- Context ---

interface ItemCardContextValue {
  data: ListItemWithSource;
  handleOpenReader: () => void;
}

const ItemCardContext = createContext<ItemCardContextValue | null>(null);

function useItemCard() {
  const context = useContext(ItemCardContext);
  if (!context) {
    throw new Error(
      "ItemCard compound components must be used within an ItemCard",
    );
  }
  return context;
}

// --- Root Components ---

interface ItemCardProps {
  data: ListItemWithSource;
  className?: string;
  "data-tour"?: string;
  layout: FeedLayout;
}

function CardShell({
  className,
  dataTour,
  children,
}: {
  className?: string;
  dataTour?: string;
  children: React.ReactNode;
}) {
  const { data } = useItemCard();
  const { item } = data;

  return (
    <article
      className={cn(
        "group relative border-b border-border overflow-hidden transition-all hover:bg-accent/60 cursor-pointer",
        className,
      )}
      aria-labelledby={`title-${item.id}`}
      data-tour={dataTour}
    >
      {children}
    </article>
  );
}

export function ItemCard({
  data,
  layout,
  className,
  "data-tour": dataTour,
}: ItemCardProps) {
  const { item } = data;
  const { setActiveItemId } = useActiveItem();

  const handleOpenReader = () => {
    setActiveItemId(item.id);
  };

  const contextValue = { data, handleOpenReader };

  return (
    <ItemCardContext.Provider value={contextValue}>
      {layout === FeedLayout.Grid ? (
        <GridCardContent className={className} dataTour={dataTour} />
      ) : layout === FeedLayout.Rows ? (
        <RowCardContent className={className} dataTour={dataTour} />
      ) : (
        <ListCardContent className={className} dataTour={dataTour} />
      )}
    </ItemCardContext.Provider>
  );
}

// --- Atomic Compound Components ---

ItemCard.Source = function CardSource({ className }: { className?: string }) {
  const { data } = useItemCard();
  const { feed, categoryColor } = data;

  return (
    <div className={cn("flex items-center gap-1 min-w-0", className)}>
      <FeedIcon
        url={feed.iconUrl || feed.url}
        title={feed.title || "Untitled Feed"}
        className="shrink-0"
        size={20}
        categoryColor={categoryColor}
      />
      <span className="text-sm text-muted-foreground truncate">
        {feed.title || "Untitled Feed"}
      </span>
    </div>
  );
};

ItemCard.Date = function CardDate({
  className,
  showSeparator = false,
}: {
  className?: string;
  showSeparator?: boolean;
}) {
  const { data } = useItemCard();
  const { item } = data;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showSeparator && (
        <div className="size-1 rounded-full bg-muted-foreground/50" />
      )}
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        <RelativeDate date={item.publishedAt || item.createdAt} />
      </span>
    </div>
  );
};

ItemCard.Title = function CardTitle({
  className,
  clamped = false,
}: {
  className?: string;
  clamped?: boolean;
}) {
  const { data, handleOpenReader } = useItemCard();
  const { item, isRead } = data;

  return (
    <>
      <h3
        id={`title-${item.id}`}
        className={cn(
          "text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors",
          clamped && "line-clamp-3",
          className,
        )}
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
    </>
  );
};

ItemCard.Excerpt = function CardExcerpt({
  className,
  clampLines = 2,
}: {
  className?: string;
  clampLines?: number;
}) {
  const { data } = useItemCard();
  const { item } = data;

  if (!item.description) return null;

  return (
    <div
      className={cn(
        "text-sm text-muted-foreground leading-relaxed overflow-hidden pointer-events-none",
        clampLines === 2 ? "line-clamp-2" : "line-clamp-4",
        className,
      )}
    >
      {item.description}
    </div>
  );
};

ItemCard.Badge = function CardBadge({ className }: { className?: string }) {
  const { data } = useItemCard();
  const { categoryName, categoryColor } = data;

  if (!categoryName) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs px-1.5 py-0 font-semibold rounded-sm border-0",
        className,
      )}
      style={{
        background: categoryColor ? `${categoryColor}40` : undefined,
        color: categoryColor ?? undefined,
      }}
    >
      {categoryName}
    </Badge>
  );
};

ItemCard.Bookmark = function CardBookmark({
  className,
}: {
  className?: string;
}) {
  const { data } = useItemCard();
  const { isBookmarked, item } = data;
  const { mutate: toggleBookmark } = useToggleBookmark();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark({ itemId: item.id });
      }}
      aria-label={isBookmarked ? "Remove from saved" : "Save for later"}
      className={cn(
        "group relative z-20 transition-all shrink-0 size-8 p-0 hover:bg-primary/10",
        isBookmarked && "text-primary",
        className,
      )}
    >
      <BookmarkIcon
        className={cn(
          "size-4 text-muted-foreground group-hover:text-primary transition-colors",
          isBookmarked && "fill-current text-primary",
        )}
      />
    </Button>
  );
};

ItemCard.UnreadIndicator = function CardUnreadIndicator({
  className,
}: {
  className?: string;
}) {
  const { data } = useItemCard();

  return (
    <div className={cn("flex shrink-0", className)}>
      {!data.isRead && (
        <div className="size-2 rounded-full bg-unread-indicator" />
      )}
    </div>
  );
};

// --- Layout Content variants ---

function GridCardContent({
  className,
  dataTour,
}: {
  className?: string;
  dataTour?: string;
}) {
  return (
    <CardShell
      className={cn(
        "w-full h-50 flex flex-col gap-1 p-4 border rounded-lg",
        className,
      )}
      dataTour={dataTour}
    >
      <header className="flex items-center justify-between gap-3 mb-1">
        <ItemCard.Source />
        <ItemCard.UnreadIndicator />
      </header>
      <ItemCard.Title clamped={true} className="shrink-0" />
      <ItemCard.Excerpt clampLines={4} />
      <footer className="mt-auto flex items-center justify-between gap-2">
        <ItemCard.Badge className="shrink" />
        <div className="grow flex items-center justify-end gap-2 shrink-0">
          <ItemCard.Date />
          <ItemCard.Bookmark />
        </div>
      </footer>
    </CardShell>
  );
}

function RowCardContent({
  className,
  dataTour,
}: {
  className?: string;
  dataTour?: string;
}) {
  return (
    <CardShell
      className={cn("flex gap-3 p-2 md:p-3", className)}
      dataTour={dataTour}
    >
      <ItemCard.UnreadIndicator className="w-2 items-center" />
      <div className="flex-1 space-y-1 min-w-0">
        <header className="flex">
          <ItemCard.Source />
          <ItemCard.Date showSeparator className="pl-2" />
        </header>
        <ItemCard.Title className="truncate" />
      </div>
      <ItemCard.Bookmark />
    </CardShell>
  );
}

function ListCardContent({
  className,
  dataTour,
}: {
  className?: string;
  dataTour?: string;
}) {
  return (
    <CardShell
      className={cn("flex gap-4 p-4 lg:p-6", className)}
      dataTour={dataTour}
    >
      <ItemCard.UnreadIndicator className="pt-2 w-2" />
      <div className="flex-1 min-w-0">
        <header className="flex mb-1.5">
          <ItemCard.Source />
          <ItemCard.Date showSeparator className="pl-2" />
        </header>
        <ItemCard.Title className="mb-1.5" />
        <ItemCard.Excerpt className="not-last:mb-3" />
        <ItemCard.Badge className="max-w-full" />
      </div>
      <ItemCard.Bookmark />
    </CardShell>
  );
}
