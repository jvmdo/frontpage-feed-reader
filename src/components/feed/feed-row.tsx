"use client";
import { formatDistanceToNow } from "date-fns";
import { Edit2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Feed, Subscription } from "@/types";

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
  const status =
    HEALTH_STATUS_CONFIG[feed.healthStatus] ?? HEALTH_STATUS_CONFIG.unknown;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {subscription.customTitle ?? feed.title ?? "Untitled"}
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
        {feed.lastSuccessAt
          ? formatDistanceToNow(feed.lastSuccessAt, { addSuffix: true })
          : "Never"}
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
            <DropdownMenuItem>
              <RefreshCw data-icon="inline-start" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit2 data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
