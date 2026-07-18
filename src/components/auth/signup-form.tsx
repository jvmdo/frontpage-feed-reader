"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useSignUp } from "@/hooks/user/use-sign-up";
import { cn } from "@/lib/utils";
import { type SignUpInput, signUpSchema } from "@/lib/validations/auth";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { mutate: signUp, isPending } = useSignUp();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: SignUpInput) => {
    signUp(data, {
      onSuccess: () => {
        toast.success("Account created successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form
      noValidate
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isPending}
            {...register("name")}
            aria-describedby="error-name"
          />
          {errors.name && (
            <FieldError id="error-name">{errors.name.message}</FieldError>
          )}
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
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
          <PasswordInput.Label htmlFor="password">Password</PasswordInput.Label>
          <PasswordInput.Control
            id="password"
            disabled={isPending}
            {...register("password")}
            aria-describedby="error-password"
          />
          <PasswordInput.StrengthMeter password={passwordValue} />
          <FieldDescription>
            Must be between 6 and 32 characters long.
          </FieldDescription>
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
          <PasswordInput.Label htmlFor="confirm-password">
            Confirm Password
          </PasswordInput.Label>
          <PasswordInput.Control
            id="confirm-password"
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
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
