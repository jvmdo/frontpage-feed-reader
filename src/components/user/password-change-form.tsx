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
import { FieldError, FieldGroup } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
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
    watch,
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

  const passwordValue = watch("newPassword");

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
              <PasswordInput.Root
                data-invalid={!!errors.currentPassword}
                autoComplete="current-password"
              >
                <PasswordInput.Label htmlFor="current-password">
                  Current Password
                </PasswordInput.Label>
                <PasswordInput.Control
                  id="current-password"
                  disabled={isPending}
                  {...register("currentPassword")}
                />
                {errors.currentPassword && (
                  <FieldError id="current-password-error">
                    {errors.currentPassword.message}
                  </FieldError>
                )}
              </PasswordInput.Root>
            )}

            <PasswordInput.Root
              data-invalid={!!errors.newPassword}
              autoComplete="new-password"
            >
              <PasswordInput.Label htmlFor="new-password">
                New Password
              </PasswordInput.Label>
              <PasswordInput.Control
                id="new-password"
                disabled={isPending}
                {...register("newPassword")}
              />
              <PasswordInput.StrengthMeter password={passwordValue} />
              {errors.newPassword && (
                <FieldError id="new-password-error">
                  {errors.newPassword.message}
                </FieldError>
              )}
            </PasswordInput.Root>

            <PasswordInput.Root
              data-invalid={!!errors.confirmPassword}
              autoComplete="new-password"
            >
              <PasswordInput.Label htmlFor="confirm-password">
                Confirm New Password
              </PasswordInput.Label>
              <PasswordInput.Control
                id="confirm-password"
                disabled={isPending}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <FieldError id="confirm-password-error">
                  {errors.confirmPassword.message}
                </FieldError>
              )}
            </PasswordInput.Root>
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

export function PasswordChangeFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader className="mb-1">
          <Skeleton className="h-5.75 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-7">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Skeleton className="h-9 w-26 rounded-md" />
      </div>
    </div>
  );
}
