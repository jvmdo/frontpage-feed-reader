"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
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
import { useUpdateCategory } from "@/hooks/category/use-update-category";
import {
  type UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/validations/category";
import type { Category } from "@/types";

interface RenameCategoryDialogProps {
  category: Category;
  children: React.ReactNode;
}

export function RenameCategoryDialog({
  category,
  children,
}: RenameCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Category</DialogTitle>
          <DialogDescription>
            Enter a new name for your category.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RenameCategoryForm
            category={category}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RenameCategoryFormProps {
  category: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function RenameCategoryForm({
  category,
  onSuccess,
  onCancel,
}: RenameCategoryFormProps) {
  const { mutate: updateCategory, isPending } = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      id: category.id,
      name: category.name,
    },
  });

  const onSubmit = (data: UpdateCategoryInput) => {
    updateCategory(data, {
      onSuccess: () => {
        toast.success("Category renamed successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to rename category");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor={`rename-${category.id}`}>Name</FieldLabel>
          <Input
            id={`rename-${category.id}`}
            placeholder="e.g. Design, Frontend, AI"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={
              errors.name ? `rename-${category.id}-error` : undefined
            }
            disabled={isPending}
          />
          {errors.name && (
            <FieldError id={`rename-${category.id}-error`}>
              {errors.name.message}
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
