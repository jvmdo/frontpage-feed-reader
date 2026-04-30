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
import { useCreateCategory } from "@/hooks/category/use-create-category";
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
  const { mutate: createCategory, isPending } = useCreateCategory();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const onSubmit = (data: CreateCategoryInput) => {
    createCategory(data, {
      onSuccess: () => {
        toast.success("Category created successfully");
        setOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create category");
      },
    });
  };

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

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                placeholder="e.g. Design, Frontend, AI"
                {...register("name")}
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? "category-name-error" : undefined
                }
              />
              {errors.name && (
                <FieldError id="category-name-error">
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
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Create Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
