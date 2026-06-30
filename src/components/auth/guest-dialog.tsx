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
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useConvertGuest } from "@/hooks/user/use-convert-guest";
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
  const { mutate: convertGuest, isPending } = useConvertGuest();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GuestConversionInput>({
    resolver: zodResolver(guestConversionSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: GuestConversionInput) => {
    convertGuest(data, {
      onSuccess: () => {
        toast.success("Account created successfully!", {
          description:
            "We recommend setting your personal info in profile page.",
        });
        reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const passwordValue = watch("password");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Enter your email and password to convert your guest session into a
            permanent account. Your current progress will be preserved.
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
                disabled={isPending}
                {...register("email")}
                aria-describedby="error-email"
              />
              {errors.email && (
                <FieldError id="error-email">{errors.email.message}</FieldError>
              )}
            </Field>
            <PasswordInput.Root
              data-invalid={!!errors.password}
              autoComplete="new-password"
            >
              <PasswordInput.Label htmlFor="password">
                Password
              </PasswordInput.Label>
              <PasswordInput.Control
                id="password"
                placeholder="••••••••"
                disabled={isPending}
                {...register("password")}
                aria-describedby="error-password"
              />
              <PasswordInput.StrengthMeter password={passwordValue} />
              {errors.password && (
                <FieldError id="error-password">
                  {errors.password.message}
                </FieldError>
              )}
            </PasswordInput.Root>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Spinner data-icon="inline-start" />}
              {isPending ? "Saving..." : "Create Account"}
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
