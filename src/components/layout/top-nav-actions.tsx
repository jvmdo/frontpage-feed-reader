"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

export function TopNavActions() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-end gap-3">
      {/* TODO: search articles */}
      <button
        type="button"
        className="flex items-center flex-1 max-w-[16rem] gap-2 bg-accent rounded-md px-3 py-1.5 hover:bg-accent-hover/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search articles"
      >
        <SearchIcon className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          Search articles...
        </span>
        <Kbd className="ml-auto hidden lg:inline-flex">/</Kbd>
      </button>

      <AddFeedDialog asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 bg-accent text-muted-foreground hover:text-surface hover:bg-accent-hover"
          aria-label="Add feed"
        >
          <PlusIcon className="size-4" />
        </Button>
      </AddFeedDialog>

      <Avatar className="size-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
          MS
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
