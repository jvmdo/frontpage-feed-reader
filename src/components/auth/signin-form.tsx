"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import GithubButton from "@/components/auth/github-button";
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
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { type SignInInput, signInSchema } from "@/lib/validations/auth";

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      toast.error(error.message || "Invalid email or password.");
    } else {
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    }
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
            disabled={isSubmitting}
            {...register("email")}
            aria-describedby="error-email"
          />
          {errors.email && (
            <FieldError id="error-email">{errors.email.message}</FieldError>
          )}
        </Field>
        <Field data-invalid={!!errors.password}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs underline underline-offset-4 hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            disabled={isSubmitting}
            {...register("password")}
            aria-describedby="error-password"
          />
          {errors.password && (
            <FieldError id="error-password">
              {errors.password.message}
            </FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <GithubButton disabled={isSubmitting}>
            Sign in with GitHub
          </GithubButton>
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              className="mt-2 w-full"
              asChild
              disabled={isSubmitting}
            >
              <Link href="/api/dev-login">Auto Login (Dev Only)</Link>
            </Button>
          )}
          <FieldDescription className="px-6 text-center">
            Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
