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
import { MarkAllReadAction } from "@/components/layout/components/mark-all-read-action";
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
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";
import { useRefreshUI } from "@/hooks/ui/use-refresh-ui";
import { cn } from "@/lib/utils";

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
  const [order, setOrder] = useState("newest");
  const { isDisabled: isMarkAllDisabled } = useMarkAllReadUI();
  const { isRefreshing, handleRefresh } = useRefreshUI();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          aria-label="More controls"
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {feedId && (
          <>
            <DropdownMenuItem
              onClick={handleRefresh}
              disabled={isRefreshing}
              onSelect={(e) => e.preventDefault()}
            >
              <RotateCwIcon
                className={cn("size-4", isRefreshing && "animate-spin")}
                data-icon="inline-start"
              />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {categoryId && (
          <>
            <AssignFeedsDialog categoryId={categoryId}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PlusIcon data-icon="inline-start" />
                Assign feeds
              </DropdownMenuItem>
            </AssignFeedsDialog>
            <DropdownMenuSeparator />
          </>
        )}

        <MarkAllReadAction>
          <DropdownMenuItem
            disabled={isMarkAllDisabled}
            onSelect={(e) => e.preventDefault()}
          >
            <CheckCheckIcon data-icon="inline-start" />
            Mark all read
          </DropdownMenuItem>
        </MarkAllReadAction>
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
