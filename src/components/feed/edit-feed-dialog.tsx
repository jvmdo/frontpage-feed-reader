"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/category/use-categories";
import { useUpdateFeed } from "@/hooks/feed/use-update-feed";
import {
  type UpdateFeedInput,
  updateFeedSchema,
} from "@/lib/validations/feed";
import type { Feed, Subscription } from "@/types";

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
  const { mutate: updateSubscription, isPending } = useUpdateFeed();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateFeedInput>({
    resolver: zodResolver(updateFeedSchema),
    defaultValues: {
      id: subscription.id,
      customTitle: subscription.customTitle ?? feed.title ?? "",
      categoryId: subscription.categoryId,
    },
  });

  const onSubmit = (data: UpdateFeedInput) => {
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
            Update how this subscription appears in your dashboard.
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

            <Field data-invalid={!!errors.categoryId}>
              <FieldLabel htmlFor="category-id">Category</FieldLabel>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : Number(value))
                    }
                    value={field.value?.toString() ?? "none"}
                    disabled={isPending}
                  >
                    <SelectTrigger id="category-id">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <FieldError>{errors.categoryId.message}</FieldError>
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
