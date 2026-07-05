import { useRef, useState } from "react";
import { CategoryDot } from "@/components/category/category-dot";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFilterLogic } from "@/hooks/feed/use-filter-logic";
import { cn } from "@/lib/utils";
import type { FilterStatus } from "@/types";
import { FilterTriggerContent } from "./filter-dropdown";

interface WithFeedFilterProps {
  children: (props: {
    isFilterActive: boolean;
    DesktopContent: React.ReactNode;
    DesktopSubMenu: React.ReactNode;
    MobileTrigger: React.ReactNode;
    onCloseAutoFocus: (e: Event) => void;
  }) => React.ReactNode;
}

export function WithFeedFilters({ children }: WithFeedFilterProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openingDrawerRef = useRef(false);

  const { isSaved, status, setStatus, feedIds, setFeedIds } = useFeedFilter();
  const {
    feeds,
    categoriesWithFeeds,
    toggleFeed,
    toggleCategory,
    isCategorySelected,
  } = useFilterLogic({ feedIds, setFeedIds });

  const isFilterActive = status !== "all";

  const handleCloseAutoFocus = (e: Event) => {
    if (openingDrawerRef.current) {
      e.preventDefault();
      openingDrawerRef.current = false;
    }
  };

  const isFeedSelected = (id: number) => feedIds.includes(id);

  // Reusable core content for Desktop (used in both standalone dropdown and submenu)
  const DesktopContent = (
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
                checked={isFeedSelected(f.feed.id)}
                onCheckedChange={() => toggleFeed(f.feed.id)}
                className="gap-1 pr-7 data-[state=unchecked]:pr-2"
              >
                <FeedIcon url={f.feed.iconUrl} />
                <span className="truncate">
                  {f.subscription.customTitle ||
                    f.feed.title ||
                    "Untitled Feed"}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </>
      )}
    </>
  );

  const DesktopSubMenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={cn(isFilterActive && "text-primary")}>
        <FilterTriggerContent isFilterActive={isFilterActive} />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-56">
        {DesktopContent}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  const MobileTrigger = (
    <DropdownMenuItem
      onSelect={() => {
        openingDrawerRef.current = true;
        setIsDrawerOpen(true);
      }}
      className={cn(isFilterActive && "text-primary")}
    >
      <FilterTriggerContent isFilterActive={isFilterActive} />
    </DropdownMenuItem>
  );

  return (
    <>
      {children({
        isFilterActive,
        DesktopContent,
        DesktopSubMenu,
        MobileTrigger,
        onCloseAutoFocus: handleCloseAutoFocus,
      })}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="p-4 pt-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Filter Items</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Status
              </h4>
              <RadioGroup
                value={status || "all"}
                onValueChange={(val) => setStatus(val as FilterStatus)}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value="all"
                    id="status-all"
                    className="size-5"
                  />
                  <Label
                    htmlFor="status-all"
                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All items
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value="unread"
                    id="status-unread"
                    className="size-5"
                  />
                  <Label
                    htmlFor="status-unread"
                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Unread only
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value="read"
                    id="status-read"
                    className="size-5"
                  />
                  <Label
                    htmlFor="status-read"
                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Read only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {isSaved && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Categories
                  </h4>
                  <div className="flex flex-col gap-4">
                    {categoriesWithFeeds.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-3"
                      >
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={isCategorySelected(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                          className="size-5"
                        />
                        <Label
                          htmlFor={`cat-${category.id}`}
                          className="flex items-center gap-2 text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <CategoryDot color={category.color} size="sm" />
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border my-1" />

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Individual Feeds
                  </h4>
                  <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-2">
                    {feeds.map((f) => (
                      <div key={f.feed.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`feed-${f.feed.id}`}
                          checked={isFeedSelected(f.feed.id)}
                          onCheckedChange={() => toggleFeed(f.feed.id)}
                          className="size-5"
                        />
                        <Label
                          htmlFor={`feed-${f.feed.id}`}
                          className="flex items-center gap-2 text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate max-w-full"
                        >
                          <FeedIcon url={f.feed.iconUrl} />
                          <span className="truncate">
                            {f.subscription.customTitle ||
                              f.feed.title ||
                              "Untitled Feed"}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
