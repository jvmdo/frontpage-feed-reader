"use client";

import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  CheckCheckIcon,
  Grid2X2Icon,
  ListIcon,
  MenuIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Rows3Icon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useSidebar } from "@/components/ui/sidebar";

export function BottomNav() {
  const [layout, setLayout] = useState("list");
  const [order, setOrder] = useState("newest");
  const { toggleSidebar } = useSidebar();

  return (
    <nav
      className="md:hidden h-14 border-t border-border bg-card flex items-center justify-around px-2 shrink-0 z-30"
      aria-label="Mobile navigation"
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-10 text-muted-foreground hover:text-foreground"
        onClick={toggleSidebar}
        aria-label="Open sidebar menu"
      >
        <MenuIcon className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-10 text-muted-foreground hover:text-foreground"
        aria-label="Search items"
      >
        <SearchIcon className="size-5" />
      </Button>

      <AddFeedDialog asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-muted-foreground hover:text-foreground"
          aria-label="Add new feed"
        >
          <PlusIcon className="size-5" />
        </Button>
      </AddFeedDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-muted-foreground hover:text-foreground"
            aria-label="More controls"
          >
            <MoreHorizontalIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="w-56 mb-1">
          <DropdownMenuItem>
            <CheckCheckIcon data-icon="inline-start" />
            Mark all read
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Layout</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={layout} onValueChange={setLayout}>
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

      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label="User profile"
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            MS
          </AvatarFallback>
        </Avatar>
      </Button>
    </nav>
  );
}
