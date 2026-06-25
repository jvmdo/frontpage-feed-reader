"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateFeed } from "@/hooks/feed/use-update-feed";
import { type UpdateFeedInput, updateFeedSchema } from "@/lib/validations/feed";
import type { Feed, Subscription } from "@/types";
import { CategorySelectField, FeedTitleField } from "./feed-form-fields";

interface EditFeedDialogProps {
  subscription: Subscription;
  feed: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFeedDialog({
  subscription,
  feed,
  open,
  onOpenChange,
}: EditFeedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update how this subscription appears in your dashboard.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <EditFeedForm
            subscription={subscription}
            feed={feed}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditFeedForm({
  subscription,
  feed,
  onSuccess,
  onCancel,
}: {
  subscription: Subscription;
  feed: Feed;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { mutate: updateSubscription, isPending } = useUpdateFeed();

  const methods = useForm<UpdateFeedInput>({
    resolver: zodResolver(updateFeedSchema),
    defaultValues: {
      id: subscription.id,
      customTitle: subscription.customTitle ?? feed.title ?? "",
      categoryId: subscription.categoryId,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: UpdateFeedInput) => {
    updateSubscription(data, {
      onSuccess: () => {
        toast.success("Subscription updated");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update subscription");
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FieldGroup>
          <FeedTitleField disabled={isPending} />
          <CategorySelectField disabled={isPending} />
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
