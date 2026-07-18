import type { Metadata } from "next";
import Link from "next/link";
import { OneClickAuth } from "@/components/auth/one-click-auth";
import { SignupForm } from "@/components/auth/signup-form";
import { FieldSeparator } from "@/components/ui/field";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a new Frontpage account and customize your feed aggregator.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Fill in the form below to create your account
        </p>
      </div>

      <SignupForm />

      <FieldSeparator>Or continue with</FieldSeparator>
      <OneClickAuth githubText="Sign up with GitHub" />

      <p className="px-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
