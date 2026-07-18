import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Frontpage account password.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      {searchParams.then(({ token }) => {
        if (!token) {
          return (
            <div className="flex flex-col gap-6 text-center">
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Enter your new password below.
              </p>
            </div>

            <ResetPasswordForm token={token as string} />

            <div className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link
                href="/sign-in"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </div>
          </div>
        );
      })}
    </Suspense>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-56" />
      </div>

      <div className="flex w-full flex-col gap-7">
        {/* New Password Field */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-1 flex-1" />
            <Skeleton className="h-1 flex-1" />
            <Skeleton className="h-1 flex-1" />
            <Skeleton className="h-1 flex-1" />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Submit Button */}
        <Skeleton className="h-9 w-full" />
      </div>

      <div className="mt-1 flex justify-center">
        <Skeleton className="h-5 w-48" />
      </div>
    </div>
  );
}
