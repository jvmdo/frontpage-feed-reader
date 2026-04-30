"use client";

import { CheckCheckIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMarkAllRead } from "@/hooks/feed/use-mark-all-read";
import { useUnreadCounts } from "@/hooks/feed/use-unread-counts";
import { cn } from "@/lib/utils";

export function MarkAllReadAction({
  feedId,
  categoryId,
  className,
}: {
  feedId: number | null;
  categoryId: number | null;
  className?: string;
}) {
  const { data: unreadCounts } = useUnreadCounts();
  const { mutate: markAllRead, isPending: isMarkingRead } = useMarkAllRead();

  const currentCount = feedId
    ? unreadCounts?.feeds[feedId] || 0
    : categoryId
      ? unreadCounts?.categories[categoryId] || 0
      : unreadCounts?.global || 0;

  if (currentCount === 0) return null;

  const handleMarkAllRead = () => {
    const scope = feedId ? "feed" : categoryId ? "category" : "global";
    const id = feedId || categoryId || undefined;
    markAllRead({ scope, id });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isMarkingRead}
          className={cn(
            "h-8 px-3 text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          <CheckCheckIcon className="size-3.5 mr-2" />
          Mark all read
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark everything as read?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark all articles in{" "}
            {feedId
              ? "this feed"
              : categoryId
                ? "this category"
                : "all your subscriptions"}{" "}
            as read. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkAllRead}>
            Mark all as read
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
