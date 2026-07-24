"use client";

import {
  MenuIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedMenu } from "@/components/layout/components/feed-menu";
import {
  UserMenu,
  UserMenuErrorFallback,
  UserMenuSkeleton,
} from "@/components/layout/components/user-menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import type { SessionPromise } from "@/types";

export function MobileBottomNav({
  sessionPromise,
}: {
  sessionPromise: SessionPromise;
}) {
  const { toggleSidebar } = useSidebar();
  const [_, setOpen] = useSearchPaletteState();
  const { status } = useFeedFilter();

  const isFilterActive = status !== "all";

  return (
    <div
      className="md:hidden h-14 border-t border-border bg-card flex items-center justify-around z-30"
      role="toolbar"
      aria-label="Mobile quick actions"
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        onClick={toggleSidebar}
        aria-label="Open sidebar menu"
      >
        <MenuIcon className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        onClick={() => setOpen(true)}
        aria-label="Search your items"
      >
        <SearchIcon className="size-5" />
      </Button>

      <AddFeedDialog asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label="Add new feed"
          data-tour="add-feed"
        >
          <PlusIcon className="size-5" />
        </Button>
      </AddFeedDialog>

      <FeedMenu>
        <Button
          variant="ghost"
          size="icon"
          className={"size-10 relative"}
          aria-label="Feed menu"
        >
          <MoreHorizontalIcon className="size-5" />
          {isFilterActive && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </FeedMenu>

      <ErrorBoundary fallback={<UserMenuErrorFallback />}>
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu sessionPromise={sessionPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
