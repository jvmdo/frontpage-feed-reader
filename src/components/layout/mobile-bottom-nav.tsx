"use client";

import {
  MenuIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedMenu } from "@/components/layout/components/feed-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();

  return (
    <nav
      className="md:hidden h-14 border-t border-border bg-card flex items-center justify-around px-2 shrink-0 z-30"
      aria-label="Mobile navigation"
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
        aria-label="Search items"
      >
        <SearchIcon className="size-5" />
      </Button>

      <AddFeedDialog asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label="Add new feed"
        >
          <PlusIcon className="size-5" />
        </Button>
      </AddFeedDialog>

      <FeedMenu>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          aria-label="Feed menu"
        >
          <MoreHorizontalIcon className="size-5" />
        </Button>
      </FeedMenu>

      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label="User profile"
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-secondary text-text-primary text-xs font-semibold">
            MS
          </AvatarFallback>
        </Avatar>
      </Button>
    </nav>
  );
}
