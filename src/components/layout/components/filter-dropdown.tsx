import { FilterIcon } from "lucide-react";
import { CategoryDot } from "@/components/category/category-dot";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";
import { cn } from "@/lib/utils";
import type { FilterStatus } from "@/types";

export function FilterDropdown() {
  const { isSaved, status, setStatus, feedIds, setFeedIds } = useFeedFilter();
  const isFilterActive = status !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isFilterActive ? "secondary" : "outline"}
          className={cn(
            "lg:h-8",
            isFilterActive &&
              "text-primary border-primary/20 bg-primary/10 hover:bg-primary/15",
          )}
        >
          <FilterTriggerContent isFilterActive={isFilterActive} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <FilterMenuItems
          isSaved={isSaved}
          status={status}
          setStatus={setStatus}
          feedIds={feedIds}
          setFeedIds={setFeedIds}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterTriggerContent({
  isFilterActive,
}: {
  isFilterActive: boolean;
}) {
  return (
    <>
      <div className="relative">
        <FilterIcon className="size-4 lg:size-3.5" data-icon="inline-start" />
        {isFilterActive && (
          <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
        {isFilterActive && <span className="sr-only">(active)</span>}
      </div>
      <span className="lg:text-xs">Filter</span>
    </>
  );
}

export function FilterMenuItems({
  isSaved,
  status,
  setStatus,
  feedIds,
  setFeedIds,
}: {
  isSaved: boolean;
  status: FilterStatus;
  setStatus: (status: FilterStatus) => void;
  feedIds: number[];
  setFeedIds: (ids: number[]) => void;
}) {
  return (
    <>
      <DropdownMenuLabel>Status</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={status || "all"}
        onValueChange={(val) => setStatus(val as FilterStatus)}
      >
        <DropdownMenuRadioItem value="all">All items</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="unread">
          Unread only
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="read">Read only</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

      {isSaved && (
        <RefinementFilters feedIds={feedIds} setFeedIds={setFeedIds} />
      )}
    </>
  );
}

function RefinementFilters({
  feedIds,
  setFeedIds,
}: {
  feedIds: number[];
  setFeedIds: (ids: number[]) => void;
}) {
  const { data: categories } = useCategories();
  const { data: feeds } = useFeeds();

  const toggleFeed = (id: number) => {
    if (feedIds.includes(id)) {
      setFeedIds(feedIds.filter((fid) => fid !== id));
    } else {
      setFeedIds([...feedIds, id]);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const categoryFeeds = feeds
      .filter((f) => f.subscription.categoryId === categoryId)
      .map((f) => f.feed.id);

    const allSelected = categoryFeeds.every((id) => feedIds.includes(id));

    if (allSelected) {
      // Remove all feeds of this category
      setFeedIds(feedIds.filter((id) => !categoryFeeds.includes(id)));
    } else {
      // Add all feeds of this category (unique)
      setFeedIds([...new Set([...feedIds, ...categoryFeeds])]);
    }
  };

  const isCategorySelected = (categoryId: number) => {
    const categoryFeeds = feeds
      .filter((f) => f.subscription.categoryId === categoryId)
      .map((f) => f.feed.id);

    if (categoryFeeds.length === 0) return false;
    return categoryFeeds.every((id) => feedIds.includes(id));
  };

  const categoriesWithFeeds = categories.filter(({ id }) =>
    feeds.some((f) => f.subscription.categoryId === id),
  );

  return (
    <>
      <DropdownMenuSeparator />

      <DropdownMenuLabel>Categories</DropdownMenuLabel>
      <DropdownMenuGroup>
        {categoriesWithFeeds.map((category) => (
          <DropdownMenuCheckboxItem
            key={category.id}
            checked={isCategorySelected(category.id)}
            onCheckedChange={() => toggleCategory(category.id)}
            className="gap-1"
          >
            <CategoryDot color={category.color} size="sm" />
            {category.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>Individual Feeds</DropdownMenuLabel>
      <DropdownMenuGroup className="max-h-60 overflow-y-auto">
        {feeds.map((f) => (
          <DropdownMenuCheckboxItem
            key={f.feed.id}
            checked={feedIds.includes(f.feed.id)}
            onCheckedChange={() => toggleFeed(f.feed.id)}
            className="gap-1 pr-7 data-[state=unchecked]:pr-2"
          >
            <FeedIcon url={f.feed.iconUrl} />
            <span className="truncate">
              {f.subscription.customTitle || f.feed.title || "Untitled Feed"}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}
