"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRemoveFeed } from "@/hooks/feed/use-remove-feed";
import type { Feed, Subscription } from "@/types";

interface RemoveFeedDialogProps {
  subscription: Subscription;
  feed: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveFeedDialog({
  subscription,
  feed,
  open,
  onOpenChange,
}: RemoveFeedDialogProps) {
  const { mutate: removeFeed, isPending } = useRemoveFeed();

  const handleRemove = () => {
    removeFeed(
      { id: subscription.id },
      {
        onSuccess: () => {
          toast.success("Feed removed");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove feed");
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Remove Feed</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {subscription.customTitle ?? feed.title ?? "this feed"}
            </span>?
            This action cannot be undone and you will stop receiving updates from{" "}
            <span className="break-all italic">{feed.url}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={isPending}
          >
            {isPending && (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            )}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
