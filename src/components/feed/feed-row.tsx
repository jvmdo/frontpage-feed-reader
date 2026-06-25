import {
  Edit2,
  Loader2Icon,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryDot } from "@/components/category/category-dot";
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
import { useCategories } from "@/hooks/category/use-categories";
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
  const { mutate: refreshFeed, isPending } = useRefreshFeed();
  const { data: categories } = useCategories();

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

  const category = categories?.find((c) => c.id === subscription.categoryId);
  const status =
    HEALTH_STATUS_CONFIG[feed.healthStatus] ?? HEALTH_STATUS_CONFIG.unknown;

  return (
    <TableRow>
      <TableCell>
        <Badge variant={status.variant} className={status.className}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <FeedIcon url={feed.iconUrl} title={feed.title} size={24} />
          {subscription.customTitle ?? feed.title ?? "Untitled"}
        </div>
      </TableCell>
      <TableCell>{feed.url}</TableCell>
      <TableCell>
        {category ? (
          <div className="flex items-center gap-1.5">
            <CategoryDot color={category.color} size="sm" />
            <span className="text-sm font-medium">{category.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Uncategorized
          </span>
        )}
      </TableCell>
      <TableCell>
        <LastFetched date={feed.lastSuccessAt} isRefreshing={isPending} />
      </TableCell>
      <TableCell className="text-right">
        <ActionsMenu
          feed={feed}
          subscription={subscription}
          isRefreshing={isPending}
          onRefresh={handleRefresh}
        />
      </TableCell>
    </TableRow>
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
    <div
      className={isRefreshing ? "animate-pulse opacity-50" : ""}
      aria-busy={isRefreshing}
    >
      <RelativeDate date={date} />
      <span role="status" className="sr-only">
        {isRefreshing ? "Refreshing feed..." : ""}
      </span>
    </div>
  );
}

interface ActionsMenuProps extends FeedRowProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

function ActionsMenu({
  feed,
  subscription,
  isRefreshing,
  onRefresh,
}: ActionsMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal data-icon="inline" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
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
