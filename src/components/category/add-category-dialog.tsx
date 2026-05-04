"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
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
import { Spinner } from "@/components/ui/spinner";
import { useCreateCategory } from "@/hooks/category/use-create-category";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/constants";
import {
  type CreateCategoryInput,
  createCategorySchema,
} from "@/lib/validations/category";

interface AddCategoryDialogProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

export function AddCategoryDialog({
  children,
  asChild,
}: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your feeds.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AddCategoryForm
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddCategoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function AddCategoryForm({ onSuccess, onCancel }: AddCategoryFormProps) {
  const { mutate: createCategory, isPending } = useCreateCategory();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      color: DEFAULT_CATEGORY_COLOR,
    },
  });

  const onSubmit = (data: CreateCategoryInput) => {
    createCategory(data, {
      onSuccess: () => {
        toast.success("Category created successfully");
        reset();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create category");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            placeholder="e.g. Design, Frontend, AI"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            disabled={isPending}
          />
          {errors.name && (
            <FieldError id="name-error">{errors.name.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>Color</FieldLabel>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                value={field.value}
                onValueChange={({ value }) => field.onChange(value)}
                disabled={isPending}
              />
            )}
          />
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
          {isPending ? "Creating..." : "Create Category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
