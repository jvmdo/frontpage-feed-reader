"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, CloudOff } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useRefreshTaskStatus } from "@/hooks/system/use-refresh-task-status";

function RefreshTaskStatusBannerContent() {
  const { data: status } = useRefreshTaskStatus();

  const isHealthy = status.active && !status.isFailing;

  return (
    <Item
      className={
        isHealthy
          ? "border-success/20 bg-success/10"
          : "border-destructive/20 bg-destructive/10"
      }
    >
      <ItemMedia>
        {isHealthy ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <CloudOff className="size-5 text-destructive" />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          Background Engine {isHealthy ? "Healthy" : "Offline"}
        </ItemTitle>
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

export function RefreshTaskStatusBanner() {
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <Item className="border-destructive/20 bg-destructive/10">
          <ItemMedia>
            <CloudOff className="size-5 text-destructive" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Sync Telemetry Offline</ItemTitle>
            <ItemDescription>
              Unable to verify the background engine status. Check your
              connection or configuration.
            </ItemDescription>
          </ItemContent>
        </Item>
      )}
    >
      <RefreshTaskStatusBannerContent />
    </ErrorBoundary>
  );
}
