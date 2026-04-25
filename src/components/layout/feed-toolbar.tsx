"use client";

import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  CheckCheckIcon,
  Grid2X2Icon,
  ListIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RotateCwIcon,
  Rows3Icon,
} from "lucide-react";
import { useState } from "react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useMarkAllRead } from "@/hooks/use-mark-all-read";
import { useRefreshFeed } from "@/hooks/use-refresh-feed";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import { cn } from "@/lib/utils";
import type { Category, FeedWithSubscription } from "@/types";

export function FeedToolbar() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();
  const { data: unreadCounts } = useUnreadCounts();
  const { mutate: markAllRead, isPending: isMarkingRead } = useMarkAllRead();
  const { mutate: refreshFeed, isPending: isRefreshing } = useRefreshFeed();

  const [layout, setLayout] = useState("list");
  const [order, setOrder] = useState("newest");

  const { title } = getHeaderContent(
    feedId,
    categoryId,
    subscriptions,
    categories,
  );

  const currentCount = feedId
    ? unreadCounts?.feeds[feedId] || 0
    : categoryId
      ? unreadCounts?.categories[categoryId] || 0
      : unreadCounts?.global || 0;

  const handleMarkAllRead = () => {
    const scope = feedId ? "feed" : categoryId ? "category" : "global";
    const id = feedId || categoryId || undefined;
    markAllRead({ scope, id });
  };

  const handleRefresh = () => {
    if (feedId) {
      refreshFeed({ id: feedId });
    }
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {currentCount > 0 && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Desktop: layout toggles */}
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={(v) => v && setLayout(v)}
            className="hidden lg:flex border border-border rounded-md overflow-hidden mr-3 gap-0"
          >
            <ToggleGroupItem
              value="list"
              className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground border-r border-border"
              aria-label="List view"
            >
              <ListIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="grid"
              className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground border-r border-border"
              aria-label="Grid view"
            >
              <Grid2X2Icon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="rows"
              className="p-1.5 h-auto rounded-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground text-muted-foreground hover:text-foreground"
              aria-label="Rows view"
            >
              <Rows3Icon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Refresh — visible on mobile since it's not in BottomNav */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !feedId}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <RotateCwIcon
              className={cn("size-3.5 mr-2", isRefreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>

          {/* Desktop/Tablet only: Mark all read and Assign */}
          <div className="hidden sm:flex items-center gap-1.5">
            {currentCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isMarkingRead}
                    className="hidden lg:inline-flex h-8 px-3 text-muted-foreground hover:text-foreground"
                  >
                    <CheckCheckIcon className="size-3.5 mr-2" />
                    Mark all read
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Mark everything as read?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark all articles in{" "}
                      {feedId
                        ? "this feed"
                        : categoryId
                          ? "this category"
                          : "all your subscriptions"}{" "}
                      as read. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMarkAllRead}>
                      Mark all as read
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {categoryId && (
              <AssignFeedsDialog categoryId={categoryId}>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex h-8 px-3 text-muted-foreground hover:text-foreground"
                >
                  <PlusIcon className="size-3.5 mr-2" />
                  Assign
                </Button>
              </AssignFeedsDialog>
            )}

            {/* Tablet: controls menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="inline-flex lg:hidden size-8 text-muted-foreground hover:text-foreground"
                  aria-label="More controls"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={handleMarkAllRead}
                  disabled={isMarkingRead || currentCount === 0}
                >
                  <CheckCheckIcon data-icon="inline-start" />
                  Mark all read
                </DropdownMenuItem>
                {categoryId && (
                  <AssignFeedsDialog categoryId={categoryId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <PlusIcon data-icon="inline-start" />
                      Assign feeds
                    </DropdownMenuItem>
                  </AssignFeedsDialog>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Layout</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={layout}
                  onValueChange={setLayout}
                >
                  <DropdownMenuRadioItem value="list">
                    <ListIcon data-icon="inline-start" />
                    List
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="grid">
                    <Grid2X2Icon data-icon="inline-start" />
                    Grid
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rows">
                    <Rows3Icon data-icon="inline-start" />
                    Rows
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={order} onValueChange={setOrder}>
                  <DropdownMenuRadioItem value="newest">
                    <ArrowDownAZIcon data-icon="inline-start" />
                    Newest
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest">
                    <ArrowUpAZIcon data-icon="inline-start" />
                    Oldest
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* New items banner placeholder */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors border-t border-border/50"
      >
        <ArrowUpAZIcon className="size-3.5" />5 new items since your last visit
      </button>
    </div>
  );
}

function getHeaderContent(
  feedId: number | null,
  categoryId: number | null,
  subscriptions: FeedWithSubscription[] = [],
  categories: Category[] = [],
) {
  if (feedId) {
    const sub = subscriptions.find((s) => s.feed.id === feedId);
    if (sub) {
      const title =
        sub.subscription.customTitle || sub.feed.title || "Untitled Feed";
      return { title };
    }
  }

  if (categoryId) {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      return { title: category.name };
    }
  }

  return { title: "All Items" };
}
