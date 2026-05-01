"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCategories } from "@/hooks/category/use-categories";
import { useUpdateFeed } from "@/hooks/feed/use-update-feed";
import { type UpdateFeedInput, updateFeedSchema } from "@/lib/validations/feed";
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

interface EditFeedFormProps {
  subscription: Subscription;
  feed: Feed;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditFeedForm({
  subscription,
  feed,
  onSuccess,
  onCancel,
}: EditFeedFormProps) {
  const { data: categories } = useCategories();
  const { mutate: updateSubscription, isPending } = useUpdateFeed();

  const {
    register,
    handleSubmit,
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
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update subscription");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors.customTitle}>
          <FieldLabel htmlFor="custom-title">Title</FieldLabel>
          <Input
            id="custom-title"
            placeholder="Enter a title"
            disabled={isPending}
            {...register("customTitle")}
            aria-invalid={!!errors.customTitle}
            aria-describedby={errors.customTitle ? "title-error" : undefined}
          />
          {errors.customTitle && (
            <FieldError id="title-error">
              {errors.customTitle.message}
            </FieldError>
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
                <SelectTrigger
                  id="category-id"
                  aria-invalid={!!errors.categoryId}
                  aria-describedby={
                    errors.categoryId ? "category-error" : undefined
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <FieldError id="category-error">
              {errors.categoryId.message}
            </FieldError>
          )}
        </Field>
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
  );
}
