"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useEffect, useState } from "react";
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
  DialogTrigger,
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
import { useAddFeed } from "@/hooks/feed/use-add-feed";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";

interface AddFeedDialogProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function AddFeedDialog({ children, asChild }: AddFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const { isTourActive } = useTourStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent
        onPointerDownOutside={(e) => {
          if (isTourActive) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isTourActive) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
          <DialogDescription>
            Enter the URL of the RSS or Atom feed you want to subscribe to.
          </DialogDescription>
        </DialogHeader>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          }
        >
          {open && (
            <AddFeedForm
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

interface AddFeedFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddFeedForm({ onSuccess, onCancel }: AddFeedFormProps) {
  const { data: categories } = useCategories();
  const { mutate: addFeed, isPending } = useAddFeed();
  const { prefillUrl, isTourActive } = useTourStore();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AddFeedInput>({
    resolver: zodResolver(addFeedSchema),
    defaultValues: {
      url: prefillUrl ?? "",
      categoryId: null,
    },
  });

  // Update form value if prefillUrl changes while dialog is open
  useEffect(() => {
    if (prefillUrl) {
      setValue("url", prefillUrl);
    }
  }, [prefillUrl, setValue]);

  const onSubmit = (data: AddFeedInput) => {
    addFeed(data, {
      onSuccess: () => {
        toast.success("Feed added successfully");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add feed");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field
          data-invalid={!!errors.url}
          data-disabled={isPending}
          data-tour="add-feed-url"
        >
          <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
          <Input
            id="feed-url"
            placeholder="https://example.com/feed.xml"
            disabled={isPending}
            readOnly={isTourActive}
            {...register("url")}
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? "url-error" : undefined}
            data-tour="add-feed-url"
          />
          {errors.url && (
            <FieldError id="url-error">{errors.url.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.categoryId}>
          <FieldLabel htmlFor="category-id">Category</FieldLabel>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value?.toString() ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? null : Number(value))
                }
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
        <Button type="submit" disabled={isPending} data-tour="add-feed-submit">
          {isPending && <Spinner data-icon="inline-start" />}
          {isPending ? "Adding..." : "Add Feed"}
        </Button>
      </DialogFooter>
    </form>
  );
}
