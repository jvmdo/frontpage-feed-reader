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
import { useUpdateCategory } from "@/hooks/use-update-category";
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
  const updateCategory = useUpdateCategory();

  const form = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      id: category.id,
      name: category.name,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const onSubmit = (data: UpdateCategoryInput) => {
    if (isSubmitting) return;

    updateCategory.mutate(data, {
      onSuccess: () => {
        toast.success("Category renamed successfully");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to rename category");
      },
    });
  };

  const isSubmitting = updateCategory.isPending;

  React.useEffect(() => {
    if (open) {
      reset({
        id: category.id,
        name: category.name,
      });
    }
  }, [open, category, reset]);

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

        <form onSubmit={handleSubmit(onSubmit)}>
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
              />
              {errors.name && (
                <FieldError id={`rename-${category.id}-error`}>
                  {errors.name.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              aria-disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
