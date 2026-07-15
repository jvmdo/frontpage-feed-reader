"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useResetPassword } from "@/hooks/user/use-reset-password";
import { cn } from "@/lib/utils";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validations/auth";

interface ResetPasswordFormProps extends React.ComponentProps<"form"> {
  token?: string;
}

export function ResetPasswordForm({
  className,
  token,
  ...props
}: ResetPasswordFormProps) {
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    resetPassword(
      { password: data.password, confirmPassword: data.confirmPassword, token },
      {
        onSuccess: () => {
          toast.success("Password reset successfully!", {
            description: "You can now sign in.",
          });
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-sm text-balance text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your new password below.
          </p>
        </div>
        <PasswordInput.Root
          data-invalid={!!errors.password}
          autoComplete="new-password"
        >
          <PasswordInput.Label htmlFor="password">
            New Password
          </PasswordInput.Label>
          <PasswordInput.Control
            id="password"
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
        <PasswordInput.Root
          data-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
        >
          <PasswordInput.Label htmlFor="confirm">
            Confirm Password
          </PasswordInput.Label>
          <PasswordInput.Control
            id="confirm"
            disabled={isPending}
            {...register("confirmPassword")}
            aria-describedby="error-confirm"
          />
          {errors.confirmPassword && (
            <FieldError id="error-confirm">
              {errors.confirmPassword.message}
            </FieldError>
          )}
        </PasswordInput.Root>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "Resetting..." : "Reset password"}
          </Button>
        </Field>
        <div className="text-center text-sm">
          Remembered your password?{" "}
          <Link
            href="/sign-in"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
