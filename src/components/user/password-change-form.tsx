"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useChangePassword } from "@/hooks/user/use-change-password";
import { useUserAccounts } from "@/hooks/user/use-user-accounts";
import {
  type ChangePasswordInput,
  changePasswordSchema,
} from "@/lib/validations/profile";

export function PasswordChangeForm() {
  const { mutate: changePassword, isPending } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: accounts } = useUserAccounts();
  const hasPassword = accounts.some((acc) => acc.providerId === "credential");

  const onSubmit = async (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success(
          `Password ${hasPassword ? "changed" : "set"} successfully.`,
        );
        reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader>
          <CardTitle>
            <h2>{hasPassword ? "Change Password" : "Set Password"}</h2>
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? "Update your account password. Ensure your new password is at least 6 characters long."
              : "Create a password to enable logging in using your profile email. Ensure your new password is at least 6 characters long."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup>
            {hasPassword && (
              <Field data-invalid={!!errors.currentPassword}>
                <FieldLabel htmlFor="current-password">
                  Current Password
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  disabled={isPending}
                  {...register("currentPassword")}
                />
                {errors.currentPassword && (
                  <FieldError id="current-password-error">
                    {errors.currentPassword.message}
                  </FieldError>
                )}
              </Field>
            )}

            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                disabled={isPending}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <FieldError id="new-password-error">
                  {errors.newPassword.message}
                </FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirm-password">
                Confirm New Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                disabled={isPending}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <FieldError id="confirm-password-error">
                  {errors.confirmPassword.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPending
            ? hasPassword
              ? "Changing..."
              : "Setting..."
            : hasPassword
              ? "Change password"
              : "Set password"}
        </Button>
      </div>
    </form>
  );
}
