import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";
import { RelativeDate } from "@/components/shared/relative-date";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRefreshUI } from "@/hooks/ui/use-refresh-ui";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const { isRefreshing, handleRefresh, lastFetchedAt, failedFeeds } =
    useRefreshUI();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          onSelect={(e) => e.preventDefault()}
          className="text-xs"
        >
          <RotateCwIcon
            className={cn("size-3.5", isRefreshing && "animate-spin")}
            data-icon="inline-start"
          />
          Refresh
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex flex-col gap-2 p-3 max-w-70">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">Status</span>
          <span className="text-muted">
            {lastFetchedAt ? (
              <>
                Last checked <RelativeDate date={lastFetchedAt} />
              </>
            ) : (
              "Never checked"
            )}
          </span>
        </div>

        {failedFeeds.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-background/20 pt-2 w-full">
            <div className="flex items-center gap-1.5 text-warning">
              <AlertTriangleIcon className="size-3.5" />
              <span className="font-medium">
                {failedFeeds.length}{" "}
                {failedFeeds.length === 1 ? "source" : "sources"} unreachable
              </span>
            </div>
            <ul className="list-disc list-inside text-muted space-y-0.5 ml-1">
              {failedFeeds.slice(0, 5).map((title) => (
                <li key={title} className="truncate max-w-full">
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
