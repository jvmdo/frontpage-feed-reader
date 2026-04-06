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
import { useRemoveSubscription } from "@/hooks/use-remove-subscription";
import type { Feed, Subscription } from "@/types";

interface RemoveSubscriptionDialogProps {
  subscription: Subscription;
  feed: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveSubscriptionDialog({
  subscription,
  feed,
  open,
  onOpenChange,
}: RemoveSubscriptionDialogProps) {
  const { mutate: removeSubscription, isPending } = useRemoveSubscription();

  const handleRemove = () => {
    removeSubscription(
      { id: subscription.id },
      {
        onSuccess: () => {
          toast.success("Subscription removed");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove subscription");
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
          <AlertDialogTitle>Remove Subscription</AlertDialogTitle>
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
