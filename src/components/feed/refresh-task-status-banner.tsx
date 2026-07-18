"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Loader2,
  PauseCircle,
  RotateCcwIcon,
} from "lucide-react";
import { useErrorBoundary } from "react-error-boundary";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useRefreshTaskStatus } from "@/hooks/system/use-refresh-task-status";
import type { SystemSyncStatus } from "@/types";

export type BannerStatus =
  | "healthy"
  | "initializing"
  | "degraded"
  | "paused"
  | "offline";

export function deriveBannerStatus(status: SystemSyncStatus): BannerStatus {
  if (!status.active && status.isFailing) return "offline";
  if (!status.active) return "paused";
  if (status.isFailing) return "degraded";
  if (!status.lastRunAt) return "initializing";
  return "healthy";
}

const config = {
  healthy: {
    itemClass: "border-success/20 bg-success/10",
    icon: <CheckCircle2 className="size-5 text-success" />,
    title: "Background Engine Healthy",
  },
  initializing: {
    itemClass: "border-primary/20 bg-primary/10",
    icon: <Loader2 className="size-5 text-primary animate-spin" />,
    title: "Background Engine Initializing",
  },
  degraded: {
    itemClass: "border-warning/20 bg-warning/10",
    icon: <AlertTriangle className="size-5 text-warning" />,
    title: "Background Engine Degraded",
  },
  paused: {
    itemClass: "border-muted/20 bg-muted/10",
    icon: <PauseCircle className="size-5 text-muted-foreground" />,
    title: "Background Engine Paused",
  },
  offline: {
    itemClass: "border-destructive/20 bg-destructive/10",
    icon: <CloudOff className="size-5 text-destructive" />,
    title: "Background Engine Offline",
  },
} as const;

function RefreshTaskStatusBannerContent() {
  const { data: status } = useRefreshTaskStatus();

  const bannerStatus = deriveBannerStatus(status);
  const { itemClass, icon, title } = config[bannerStatus];

  return (
    <Item className={itemClass}>
      <ItemMedia>{icon}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>
          {status?.lastRunAt
            ? `Last global sync was ${formatDistanceToNow(new Date(status.lastRunAt))} ago.`
            : "Waiting for first sync..."}{" "}
          {status?.nextRunAt &&
            `Next run scheduled in ${formatDistanceToNow(new Date(status.nextRunAt))}.`}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

export function RefreshTaskStatusBannerErrorFallback() {
  const { resetBoundary } = useErrorBoundary();
  return (
    <Item className="border-destructive/20 bg-destructive/10">
      <ItemMedia>
        <CloudOff className="size-5 text-destructive" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Sync Telemetry Offline</ItemTitle>
        <ItemDescription>
          Unable to verify the background engine status. Check your connection
          or configuration.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm" onClick={resetBoundary}>
          <RotateCcwIcon className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </ItemActions>
    </Item>
  );
}

export function RefreshTaskStatusBanner() {
  return (
    <QueryErrorBoundary fallback={<RefreshTaskStatusBannerErrorFallback />}>
      <RefreshTaskStatusBannerContent />
    </QueryErrorBoundary>
  );
}
