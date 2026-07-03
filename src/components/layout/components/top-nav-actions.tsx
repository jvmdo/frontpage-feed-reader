"use client";
import { PlusIcon, SearchIcon } from "lucide-react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { UserMenu } from "@/components/layout/components/user-menu";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import type { SessionUser } from "@/lib/auth-client";

interface TopNavActionsProps {
  user: SessionUser;
}

export function TopNavActions({ user }: TopNavActionsProps) {
  const [_, setOpen] = useSearchPaletteState();

  return (
    <div className="hidden md:flex flex-1 items-center justify-end gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="max-w-[16rem] flex-1 flex items-center gap-2 bg-accent text-muted-foreground"
        aria-keyshortcuts="/"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="text-sm">Search your articles...</span>
        <Kbd aria-hidden className="ml-auto hidden lg:inline-flex">
          /
        </Kbd>
      </Button>

      <AddFeedDialog asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 bg-accent text-muted-foreground"
          aria-label="Add feed"
        >
          <PlusIcon className="size-4" />
        </Button>
      </AddFeedDialog>

      <UserMenu user={user} />
    </div>
  );
}
