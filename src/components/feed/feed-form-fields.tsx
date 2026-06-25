"use client";

import { Suspense } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/category/use-categories";

interface FormFieldsProps {
  disabled?: boolean;
}

export function FeedUrlField({
  disabled,
  readOnly,
  isTourActive,
  "data-tour": dataTour,
}: FormFieldsProps & {
  readOnly?: boolean;
  isTourActive?: boolean;
  "data-tour"?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ url: string }>();

  return (
    <Field
      data-invalid={!!errors.url}
      data-disabled={disabled}
      data-tour={dataTour}
    >
      <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
      <Input
        id="feed-url"
        placeholder="https://example.com/feed.xml"
        disabled={disabled}
        readOnly={readOnly || isTourActive}
        {...register("url")}
        aria-invalid={!!errors.url}
        aria-describedby={errors.url ? "url-error" : undefined}
        data-tour={dataTour}
      />
      {errors.url && (
        <FieldError id="url-error">{errors.url.message}</FieldError>
      )}
    </Field>
  );
}

export function CategorySelectFieldInner({
  disabled,
  showDescription = false,
}: FormFieldsProps & { showDescription?: boolean }) {
  const { data: categories } = useCategories();
  const {
    control,
    formState: { errors },
  } = useFormContext<{ categoryId: number | null }>();

  return (
    <Field data-invalid={!!errors.categoryId}>
      <FieldLabel htmlFor="category-id">Category</FieldLabel>
      {showDescription && (
        <FieldDescription className="-mt-2">
          It's optional. You can always add this feed to any category later.
        </FieldDescription>
      )}
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <Select
            value={field.value?.toString() ?? "none"}
            onValueChange={(value) =>
              field.onChange(value === "none" ? null : Number(value))
            }
            disabled={disabled}
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
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0 bg-slate-400" />
                    <span>Uncategorized</span>
                  </span>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      {errors.categoryId && (
        <FieldError id="category-error">{errors.categoryId.message}</FieldError>
      )}
    </Field>
  );
}

export function CategorySelectSkeleton() {
  return (
    <Field>
      <FieldLabel htmlFor="category-id">Category</FieldLabel>
      <Skeleton className="h-9 w-full bg-muted/40 rounded border border-input/30" />
    </Field>
  );
}

export function CategorySelectField(
  props: FormFieldsProps & { showDescription?: boolean },
) {
  return (
    <Suspense fallback={<CategorySelectSkeleton />}>
      <CategorySelectFieldInner {...props} />
    </Suspense>
  );
}

export function FeedTitleField({ disabled }: FormFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ customTitle: string }>();

  return (
    <Field data-invalid={!!errors.customTitle}>
      <FieldLabel htmlFor="custom-title">Title</FieldLabel>
      <Input
        id="custom-title"
        placeholder="Enter a title"
        disabled={disabled}
        {...register("customTitle")}
        aria-invalid={!!errors.customTitle}
        aria-describedby={errors.customTitle ? "title-error" : undefined}
      />
      {errors.customTitle && (
        <FieldError id="title-error">{errors.customTitle.message}</FieldError>
      )}
    </Field>
  );
}
