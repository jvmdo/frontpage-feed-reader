"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { toast } from "sonner";
import { FeedPreviewCard } from "@/components/feed/feed-preview-card";
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
  FieldDescription,
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
import { useVerifyFeed } from "@/hooks/feed/use-verify-feed";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";
import type { Feed } from "@/types";

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
        data-tour="add-feed-dialog"
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
        {open && (
          <AddFeedForm
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddFeedFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddFeedForm({ onSuccess, onCancel }: AddFeedFormProps) {
  const { prefillUrl } = useTourStore();

  const { mutate: addFeed, isPending } = useAddFeed();
  const {
    mutate: verifyFeed,
    data: verifyResult,
    isPending: isVerifying,
    reset: resetVerification,
  } = useVerifyFeed();

  const methods = useForm<AddFeedInput>({
    resolver: zodResolver(addFeedSchema),
    defaultValues: {
      url: prefillUrl ?? "",
      categoryId: null,
    },
  });
  const { setValue, clearErrors, getValues, setError } = methods;

  // Sync `prefillUrl` from Tour Store
  useEffect(() => {
    if (prefillUrl) {
      setValue("url", prefillUrl);
      clearErrors("url");
      resetVerification();
    }
  }, [prefillUrl, setValue, resetVerification, clearErrors]);

  const handleVerify = () => {
    const urlValue = getValues("url");

    verifyFeed(urlValue, {
      onSuccess: (data) => {
        if (!data.success) {
          setError("url", {
            type: "server",
            message: data.error || "Failed to verify feed",
          });
        }
      },
      onError: (error) => {
        setError("url", {
          type: "server",
          message: error.message,
        });
      },
    });
  };

  const handleSubmit = (data: AddFeedInput) => {
    addFeed(data, {
      onSuccess: () => {
        toast.success("Feed added successfully");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const isVerified = !!verifyResult?.success;
  const alreadySubscribed = !!verifyResult?.alreadySubscribed;

  return (
    <FormProvider {...methods}>
      {!isVerified ? (
        <VerifyFeedStep
          isVerifying={isVerifying}
          onVerify={handleVerify}
          onCancel={onCancel}
        />
      ) : (
        <Suspense
          fallback={
            <ConfigureFeedStepSkeleton
              feed={verifyResult?.feed}
              alreadySubscribed={alreadySubscribed}
            />
          }
        >
          <ConfigureFeedStep
            feed={verifyResult?.feed}
            alreadySubscribed={alreadySubscribed}
            isSubmitting={isPending}
            onSubmit={handleSubmit}
            onBack={resetVerification}
          />
        </Suspense>
      )}
    </FormProvider>
  );
}

interface VerifyFeedStepProps {
  isVerifying: boolean;
  onVerify: () => void;
  onCancel: () => void;
}

function VerifyFeedStep({
  isVerifying,
  onVerify,
  onCancel,
}: VerifyFeedStepProps) {
  const { isTourActive } = useTourStore();
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useFormContext<AddFeedInput>();

  const handleFormSubmit = async () => {
    // Validate only URL on Step 1 client-side
    const isUrlValid = await trigger("url");
    if (isUrlValid) {
      onVerify();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <Field
          data-invalid={!!errors.url}
          data-disabled={isVerifying}
          data-tour="add-feed-url"
        >
          <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
          <Input
            id="feed-url"
            placeholder="https://example.com/feed.xml"
            disabled={isVerifying}
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
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isVerifying}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isVerifying}
          data-tour="add-feed-verify"
        >
          {isVerifying && <Spinner data-icon="inline-start" />}
          {isVerifying ? "Checking..." : "Verify Feed"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ConfigureFeedStepProps {
  feed: Pick<Feed, "title" | "description" | "iconUrl"> | undefined;
  alreadySubscribed: boolean;
  isSubmitting: boolean;
  onSubmit: (data: AddFeedInput) => void;
  onBack: () => void;
}

function ConfigureFeedStep({
  feed,
  alreadySubscribed,
  isSubmitting,
  onSubmit,
  onBack,
}: ConfigureFeedStepProps) {
  const { data: categories } = useCategories();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useFormContext<AddFeedInput>();

  const showCategory = !alreadySubscribed;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <FeedPreviewCard feed={feed} alreadySubscribed={alreadySubscribed} />

        {showCategory && (
          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel htmlFor="category-id">Category</FieldLabel>
            <FieldDescription className="-mt-2">
              It's optional. You can always add this feed to any category later.
            </FieldDescription>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : Number(value))
                  }
                  disabled={isSubmitting}
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
        )}
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Edit URL
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || alreadySubscribed}
          data-tour="add-feed-submit"
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? "Adding..." : "Add Feed"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ConfigureFeedStepSkeletonProps {
  feed: Pick<Feed, "title" | "description" | "iconUrl"> | undefined;
  alreadySubscribed: boolean;
}

function ConfigureFeedStepSkeleton({
  feed,
  alreadySubscribed,
}: ConfigureFeedStepSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <FeedPreviewCard feed={feed} alreadySubscribed={alreadySubscribed} />

        {!alreadySubscribed && (
          <Field>
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-9 w-full bg-muted/40 animate-pulse rounded border border-input/30" />
          </Field>
        )}
      </FieldGroup>

      <DialogFooter>
        <Button variant="outline" disabled>
          Edit URL
        </Button>
        <Button disabled>Add Feed</Button>
      </DialogFooter>
    </div>
  );
}
