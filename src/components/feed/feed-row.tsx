"use client";

import {
  Edit2,
  Loader2Icon,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RelativeDate } from "@/components/shared/relative-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useRefreshFeed } from "@/hooks/feed/use-refresh-feed";
import type { Feed, Subscription } from "@/types";
import { EditFeedDialog } from "./edit-feed-dialog";
import { FeedIcon } from "./feed-icon";
import { RemoveFeedDialog } from "./remove-feed-dialog";

interface FeedRowProps {
  subscription: Subscription;
  feed: Feed;
}

const HEALTH_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  healthy: {
    label: "Healthy",
    variant: "outline",
    className: "bg-success-subtle text-success border-success/20",
  },
  stale: {
    label: "Stale",
    variant: "outline",
    className: "bg-warning-subtle text-warning border-warning/20",
  },
  error: {
    label: "Error",
    variant: "outline",
    className: "bg-destructive-subtle text-destructive border-destructive/20",
  },
  unknown: {
    label: "Unknown",
    variant: "secondary",
  },
};

export function FeedRow({ subscription, feed }: FeedRowProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const { mutate: refreshFeed, isPending: isRefreshing } = useRefreshFeed();

  const handleRefresh = () => {
    refreshFeed(
      { scope: "feed", id: feed.id },
      {
        onSuccess: () => {
          toast.success("Feed refreshed");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to refresh feed");
        },
      },
    );
  };

  const status =
    HEALTH_STATUS_CONFIG[feed.healthStatus] ?? HEALTH_STATUS_CONFIG.unknown;

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <FeedIcon url={feed.iconUrl} title={feed.title} size={24} />
            <span className="truncate">
              {subscription.customTitle ?? feed.title ?? "Untitled"}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground truncate max-w-75">
          {feed.url}
        </TableCell>
        <TableCell>
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        </TableCell>
        <TableCell>
          <LastFetched date={feed.lastSuccessAt} isRefreshing={isRefreshing} />
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal data-icon="inline" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit2 data-icon="inline-start" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsRemoveDialogOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <EditFeedDialog
        subscription={subscription}
        feed={feed}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <RemoveFeedDialog
        subscription={subscription}
        feed={feed}
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      />
    </>
  );
}

function LastFetched({
  date,
  isRefreshing,
}: {
  date: Date | string | null;
  isRefreshing: boolean;
}) {
  if (!date) return "Never";

  return (
    <div className={isRefreshing ? "animate-pulse opacity-50" : ""}>
      <RelativeDate date={date} />
    </div>
  );
}
