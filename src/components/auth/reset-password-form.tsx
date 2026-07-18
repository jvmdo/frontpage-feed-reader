"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

interface ResetPasswordFormProps
  extends Omit<React.ComponentProps<"form">, "children"> {
  token: string;
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

  return (
    <form
      noValidate
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
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
      </FieldGroup>
    </form>
  );
}
