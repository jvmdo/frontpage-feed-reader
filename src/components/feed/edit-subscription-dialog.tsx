"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateSubscription } from "@/hooks/use-update-subscription";
import {
  type UpdateSubscriptionInput,
  updateSubscriptionSchema,
} from "@/lib/validations/feed";
import type { Feed, Subscription } from "@/types";

interface EditSubscriptionDialogProps {
  subscription: Subscription;
  feed: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubscriptionDialog({
  subscription,
  feed,
  open,
  onOpenChange,
}: EditSubscriptionDialogProps) {
  const { mutate: updateSubscription, isPending } = useUpdateSubscription();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSubscriptionInput>({
    resolver: zodResolver(updateSubscriptionSchema),
    defaultValues: {
      id: subscription.id,
      customTitle: subscription.customTitle ?? feed.title ?? "",
    },
  });

  const onSubmit = (data: UpdateSubscriptionInput) => {
    updateSubscription(data, {
      onSuccess: () => {
        toast.success("Subscription updated");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update subscription");
      },
    });
  };

  // Reset form when dialog opens/closes to ensure fresh values
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update the title for this subscription. This only affects how it
            appears in your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={!!errors.customTitle}>
              <FieldLabel htmlFor="custom-title">Title</FieldLabel>
              <Input
                id="custom-title"
                placeholder="Enter a title"
                disabled={isPending}
                {...register("customTitle")}
              />
              {errors.customTitle && (
                <FieldError>{errors.customTitle.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
