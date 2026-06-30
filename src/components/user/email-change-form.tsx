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
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useChangeEmail } from "@/hooks/user/use-change-email";
import { useUserAccounts } from "@/hooks/user/use-user-accounts";
import {
  type ChangeEmailInput,
  changeEmailSchema,
} from "@/lib/validations/profile";

export function EmailChangeForm() {
  const { mutate: changeEmail, isPending } = useChangeEmail();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  const { data: accounts } = useUserAccounts();
  const hasPassword = accounts.some((acc) => acc.providerId === "credential");

  const onSubmit = async (data: ChangeEmailInput) => {
    changeEmail(data, {
      onSuccess: () => {
        toast.success("Email address updated successfully.");
        reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  if (!hasPassword) {
    return null;
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader>
          <CardTitle>
            <h2>Change Email Address</h2>
          </CardTitle>
          <CardDescription>
            Update the email address associated with your account. You will need
            to provide your password to confirm this change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup>
            <Field data-invalid={!!errors.newEmail}>
              <FieldLabel htmlFor="new-email">New Email Address</FieldLabel>
              <Input
                id="new-email"
                type="email"
                placeholder="new-email@example.com"
                disabled={isPending}
                {...register("newEmail")}
              />
              {errors.newEmail && (
                <FieldError id="new-email-error">
                  {errors.newEmail.message}
                </FieldError>
              )}
            </Field>

            <PasswordInput.Root
              data-invalid={!!errors.password}
              autoComplete="current-password"
            >
              <PasswordInput.Label htmlFor="confirm-change-password">
                Confirm Password
              </PasswordInput.Label>
              <PasswordInput.Control
                id="confirm-change-password"
                placeholder="••••••••"
                disabled={isPending}
                {...register("password")}
              />
              {errors.password && (
                <FieldError id="confirm-change-password-error">
                  {errors.password.message}
                </FieldError>
              )}
            </PasswordInput.Root>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPending ? "Updating..." : "Update email"}
        </Button>
      </div>
    </form>
  );
}
