"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import GithubButton from "@/components/auth/github-button";
import { GuestButton } from "@/components/auth/guest-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useSignIn } from "@/hooks/user/use-sign-in";
import { cn } from "@/lib/utils";
import { type SignInInput, signInSchema } from "@/lib/validations/auth";

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { mutate: signIn, isPending } = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    signIn(data, {
      onSuccess: () => {
        toast.success("Signed in successfully!");
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
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to Frontpage</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your credentials to access your feeds.
          </p>
        </div>
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
          autoComplete="current-password"
        >
          <div className="flex items-center justify-between">
            <PasswordInput.Label htmlFor="password">
              Password
            </PasswordInput.Label>
            <Link
              href="/forgot-password"
              className="text-xs underline underline-offset-4 hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput.Control
            id="password"
            disabled={isPending}
            {...register("password")}
            aria-describedby="error-password"
          />
          {errors.password && (
            <FieldError id="error-password">
              {errors.password.message}
            </FieldError>
          )}
        </PasswordInput.Root>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <div className="flex flex-col gap-2">
            <GithubButton disabled={isPending}>
              Sign in with GitHub
            </GithubButton>
            <GuestButton
              variant={"outline"}
              showIcon={true}
              disabled={isPending}
            />
            {process.env.NODE_ENV === "development" && (
              <Button
                asChild={true}
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                <Link href="/api/dev-login">Auto Login (Dev Only)</Link>
              </Button>
            )}
          </div>
          <FieldDescription className="px-6 text-center">
            Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
