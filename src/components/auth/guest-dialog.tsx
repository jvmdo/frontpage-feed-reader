"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import {
  type GuestConversionInput,
  guestConversionSchema,
} from "@/lib/validations/auth";

interface GuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissBanner?: (dismiss: boolean) => void;
}

export function GuestDialog({
  open,
  onOpenChange,
  dismissBanner,
}: GuestDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GuestConversionInput>({
    resolver: zodResolver(guestConversionSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: GuestConversionInput) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: Math.random().toString(36).slice(-12),
      name: "Guest User",
      callbackURL: "/dashboard",
    });

    if (error) {
      toast.error(error.message || "An error occurred during conversion.");
    } else {
      toast.success("Account created successfully!", {
        description:
          "We recommend setting your personal info in account settings.",
      });
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Enter your email to convert your guest session into a permanent
            account. Your current progress will be preserved.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                disabled={isSubmitting}
                {...register("email")}
                aria-describedby="error-email"
              />
              {errors.email && (
                <FieldError id="error-email">{errors.email.message}</FieldError>
              )}
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isSubmitting ? "Saving..." : "Create Account"}
            </Button>
          </FieldGroup>
        </form>
        {dismissBanner && (
          <>
            <Separator />
            <DialogFooter className="gap-4">
              <p className="text-xs text-text-secondary order-1">
                If you don't want to create your account now, you can do it
                later clicking the avatar button.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="sm:order-1"
                onClick={() => dismissBanner(true)}
              >
                Ok, got it.
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
