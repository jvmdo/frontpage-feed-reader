"use client";

import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  CheckCheckIcon,
  Grid2X2Icon,
  ListIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Rows3Icon,
} from "lucide-react";
import { useState } from "react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
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
import { useMarkAllRead } from "@/hooks/use-mark-all-read";
import { useUnreadCounts } from "@/hooks/use-unread-counts";

export function ToolbarActionsMenu({
  feedId,
  categoryId,
  layout,
  setLayout,
}: {
  feedId: number | null;
  categoryId: number | null;
  layout: string;
  setLayout: (v: string) => void;
}) {
  const { data: unreadCounts } = useUnreadCounts();
  const { mutate: markAllRead, isPending: isMarkingRead } = useMarkAllRead();
  const [order, setOrder] = useState("newest");

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

  // TODO: layout toggle
  // TODO: list sorting

  return (
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
  );
}
