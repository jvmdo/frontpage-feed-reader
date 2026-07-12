"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
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
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAddFeed } from "@/hooks/feed/use-add-feed";
import { useVerifyFeed } from "@/hooks/feed/use-verify-feed";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";
import type { Feed } from "@/types";
import { CategorySelectField, FeedUrlField } from "./feed-form-fields";

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

  const isVerified = !!verifyResult;
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
        <ConfigureFeedStep
          feed={verifyResult?.feed}
          alreadySubscribed={alreadySubscribed}
          isSubmitting={isPending}
          onSubmit={handleSubmit}
          onBack={resetVerification}
        />
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
  const { handleSubmit, trigger } = useFormContext<AddFeedInput>();

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
        <FeedUrlField
          disabled={isVerifying}
          isTourActive={isTourActive}
          data-tour="add-feed-url"
        />
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
  const { handleSubmit } = useFormContext<AddFeedInput>();

  const showCategory = !alreadySubscribed;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <FeedPreviewCard feed={feed} alreadySubscribed={alreadySubscribed} />

        {showCategory && (
          <CategorySelectField disabled={isSubmitting} showDescription />
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
