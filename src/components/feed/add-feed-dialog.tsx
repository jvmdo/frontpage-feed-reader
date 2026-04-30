"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { useAddFeed } from "@/hooks/feed/use-add-feed";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";

interface AddFeedDialogProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function AddFeedDialog({ children, asChild }: AddFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: addFeed, isPending } = useAddFeed();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFeedInput>({
    resolver: zodResolver(addFeedSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = (data: AddFeedInput) => {
    addFeed(data, {
      onSuccess: () => {
        toast.success("Feed added successfully");
        reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add feed");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
          <DialogDescription>
            Enter the URL of the RSS or Atom feed you want to subscribe to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.url}>
              <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
              <Input
                id="feed-url"
                placeholder="https://example.com/feed.xml"
                disabled={isPending}
                {...register("url")}
                aria-invalid={!!errors.url}
                aria-describedby={errors.url ? "field-error" : undefined}
              />
              {errors.url && (
                <FieldError id="field-error">{errors.url.message}</FieldError>
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
              {isPending && <Spinner className="mr-2" />}
              {isPending ? "Adding..." : "Add Feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
