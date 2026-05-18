"use client";

import { FilterIcon } from "lucide-react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";

export function SavedFilterDropdown() {
  const { data: categories } = useCategories();
  const { data: feeds } = useFeeds();
  const { isSaved, unreadOnly, setUnreadOnly, feedIds, setFeedIds } =
    useFeedFilter();

  if (!isSaved) return null;

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="lg:h-8">
          <FilterIcon className="size-4 lg:size-3.5" data-icon="inline-start" />
          <span className="lg:text-xs">Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={unreadOnly}
          onCheckedChange={setUnreadOnly}
        >
          Unread only
        </DropdownMenuCheckboxItem>

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
              {category.color && (
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
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
              <span className=" truncate">
                {f.subscription.customTitle || f.feed.title || "Untitled Feed"}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
