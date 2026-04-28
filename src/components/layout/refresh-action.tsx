"use client";

import { RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRefreshFeed } from "@/hooks/use-refresh-feed";
import { cn } from "@/lib/utils";

export function RefreshAction({ feedId }: { feedId: number | null }) {
  const { mutate: refreshFeed, isPending: isRefreshing } = useRefreshFeed();

  if (!feedId) {
    return null;
  }

  const handleRefresh = () => {
    refreshFeed({ id: feedId });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="h-8 px-3 text-muted-foreground hover:text-foreground"
    >
      <RotateCwIcon
        className={cn("size-3.5 mr-2", isRefreshing && "animate-spin")}
      />
      Refresh
    </Button>
  );
}
