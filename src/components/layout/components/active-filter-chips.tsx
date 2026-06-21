"use client";

import { XIcon } from "lucide-react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";
import type { Category, FeedWithSubscription, FilterStatus } from "@/types";

export function ActiveFilterChips() {
  const { isSaved, status, setStatus, feedIds, setFeedIds, clearFilter } =
    useFeedFilter();
  const { data: categories } = useCategories();
  const { data: feeds } = useFeeds();

  // If isn't /dashboard?saved=true
  if (!isSaved) return null;

  const chips = buildFilterChips({
    status,
    feedIds,
    categories,
    feeds,
    setStatus,
    setFeedIds,
  });

  if (chips.length === 0) return null;

  return (
    <div className="bg-muted/30 border-b border-border py-1 overflow-hidden">
      <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar scroll-smooth">
        {/* CSS TRICK: w-0 + gap-2 creates exactly 0.5rem (pl-2) of space that scrolls away */}
        <div aria-hidden="true" className="w-0" />

        {chips.map((chip) => (
          <Badge
            key={chip.id}
            variant="secondary"
            className="pr-1 bg-background border-border gap-0 lg:text-sm"
          >
            {chip.color && (
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: chip.color }}
              />
            )}
            {chip.iconUrl && <FeedIcon url={chip.iconUrl} size={12} />}
            <span className="pl-1">{chip.label}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-4.5 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                chip.onRemove();
              }}
              aria-label={`Remove ${chip.label} filter`}
            >
              <XIcon className="size-3" />
            </Button>
          </Badge>
        ))}

        <Button
          variant="destructive"
          size="sm"
          className="text-xs h-6 ml-auto"
          onClick={clearFilter}
        >
          Clear all
        </Button>

        <div aria-hidden="true" className="size-2 shrink-0" />
      </div>
    </div>
  );
}

type Chip = {
  id: string;
  label: string;
  onRemove: () => void;
  color?: string | null;
  iconUrl?: string | null;
};

type BuildFilterChipsParams = {
  status: FilterStatus;
  feedIds: number[];
  categories: Category[];
  feeds: FeedWithSubscription[];
  setStatus: (value: FilterStatus) => void;
  setFeedIds: (ids: number[]) => void;
};

function buildFilterChips({
  status,
  feedIds,
  categories,
  feeds,
  setStatus,
  setFeedIds,
}: BuildFilterChipsParams): Chip[] {
  const chips: Chip[] = [];
  const feedMap = new Map(feeds.map((f) => [f.feed.id, f]));
  const remainingFeedIds = new Set(feedIds);

  if (status === "unread") {
    chips.push({
      id: "unread",
      label: "Unread only",
      onRemove: () => setStatus("all"),
    });
  } else if (status === "read") {
    chips.push({
      id: "read",
      label: "Read only",
      onRemove: () => setStatus("all"),
    });
  }

  for (const category of categories) {
    const categoryFeedIds = feeds
      .filter((f) => f.subscription.categoryId === category.id)
      .map((f) => f.feed.id);

    if (
      categoryFeedIds.length > 0 &&
      categoryFeedIds.every((id) => feedIds.includes(id))
    ) {
      chips.push({
        id: `cat-${category.id}`,
        label: `Category: ${category.name}`,
        color: category.color,
        onRemove: () =>
          setFeedIds(feedIds.filter((id) => !categoryFeedIds.includes(id))),
      });

      categoryFeedIds.forEach((id) => {
        remainingFeedIds.delete(id);
      });
    }
  }

  for (const id of remainingFeedIds) {
    const feed = feedMap.get(id);
    if (feed) {
      chips.push({
        id: `feed-${id}`,
        label: feed.subscription.customTitle || feed.feed.title || "Feed",
        iconUrl: feed.feed.iconUrl,
        onRemove: () => setFeedIds(feedIds.filter((fid) => fid !== id)),
      });
    }
  }

  return chips;
}
