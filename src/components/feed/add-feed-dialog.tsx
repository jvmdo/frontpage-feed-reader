"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAddFeed } from "@/hooks/use-add-feed";
import { type AddFeedInput, addFeedSchema } from "@/lib/validations/feed";

interface AddFeedDialogProps {
  children: React.ReactNode;
}

export function AddFeedDialog({ children }: AddFeedDialogProps) {
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
          <DialogDescription>
            Enter the URL of the RSS or Atom feed you want to subscribe to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Field data-invalid={!!errors.url}>
              <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="feed-url"
                  type="url"
                  placeholder="https://example.com/feed.xml"
                  disabled={isPending}
                  {...register("url")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2Icon className="mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.url && <FieldError>{errors.url.message}</FieldError>}
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
