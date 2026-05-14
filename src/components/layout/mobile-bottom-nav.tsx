"use client";

import {
  MenuIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedMenu } from "@/components/layout/components/feed-menu";
import { UserMenu } from "@/components/layout/components/user-menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/auth-client";

interface MobileBottomNavProps {
  user: SessionUser;
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const { toggleSidebar } = useSidebar();

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
          data-tour="add-feed"
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

      <UserMenu user={user} />
    </div>
  );
}
