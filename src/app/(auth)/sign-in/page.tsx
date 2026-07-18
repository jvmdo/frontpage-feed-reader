import type { Metadata } from "next";
import Link from "next/link";
import { OneClickAuth } from "@/components/auth/one-click-auth";
import { SigninForm } from "@/components/auth/signin-form";
import { FieldSeparator } from "@/components/ui/field";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Frontpage account to access your feed aggregator.",
};

export default function SigninPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Sign in to Frontpage</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your credentials to access your feeds.
        </p>
      </div>

      <SigninForm />

      <FieldSeparator>Or continue with</FieldSeparator>
      <OneClickAuth showDevLogin={true} />

      <p className="px-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
