"use client";

import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { Suspense } from "react";
import { useErrorBoundary } from "react-error-boundary";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DeleteAccountForm,
  DeleteAccountFormSkeleton,
} from "@/components/user/delete-account-form";
import {
  EmailChangeForm,
  EmailChangeFormSkeleton,
} from "@/components/user/email-change-form";
import {
  OAuthProviders,
  OAuthProvidersSkeleton,
} from "@/components/user/oauth-providers";
import {
  PasswordChangeForm,
  PasswordChangeFormSkeleton,
} from "@/components/user/password-change-form";
import { ProfileForm } from "@/components/user/profile-form";
import { authClient, type SessionUser } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface ProfileClientProps {
  user: SessionUser & { createdAt: Date | string };
}

export function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const { data: session } = authClient.useSession();
  const currentUser = session?.user ?? initialUser;

  return (
    <div className="space-y-8">
      <ProfileForm user={currentUser} />

      {!currentUser.isAnonymous && (
        <>
          <Suspense fallback={<EmailChangeFormSkeleton />}>
            <QueryErrorBoundary
              fallback={<ProfileFormErrorFallback title="Email Settings" />}
            >
              <EmailChangeForm />
            </QueryErrorBoundary>
          </Suspense>

          <Suspense fallback={<PasswordChangeFormSkeleton />}>
            <QueryErrorBoundary
              fallback={<ProfileFormErrorFallback title="Password Settings" />}
            >
              <PasswordChangeForm />
            </QueryErrorBoundary>
          </Suspense>

          <Suspense fallback={<OAuthProvidersSkeleton />}>
            <QueryErrorBoundary
              fallback={<ProfileFormErrorFallback title="Connected Accounts" />}
            >
              <OAuthProviders />
            </QueryErrorBoundary>
          </Suspense>
        </>
      )}

      <Suspense fallback={<DeleteAccountFormSkeleton />}>
        <QueryErrorBoundary
          fallback={
            <ProfileFormErrorFallback
              title="Danger Zone"
              className="ring-destructive/50"
            />
          }
        >
          <DeleteAccountForm />
        </QueryErrorBoundary>
      </Suspense>
    </div>
  );
}

export function ProfileDetailsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Profile Form Card Skeleton */}
      <div className="space-y-6">
        <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
          <CardHeader className="mb-1.25">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Skeleton className="size-21 rounded-full" />
              <div className="space-y-2 text-center sm:text-left flex-1">
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-7.25">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end mx-auto xl:min-w-xl xl:max-w-3xl xl:mx-50">
          <Skeleton className="h-9 w-27 rounded-md" />
        </div>
      </div>

      <EmailChangeFormSkeleton />
      <OAuthProvidersSkeleton />
      <DeleteAccountFormSkeleton />
    </div>
  );
}

export function ProfileFormErrorFallback({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const { resetBoundary } = useErrorBoundary();

  return (
    <Card
      className={cn(
        "border border-destructive/20 *:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56 bg-destructive/5",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertCircleIcon className="size-5 shrink-0" />
          <h2>{title} Unavailable</h2>
        </CardTitle>
        <CardDescription>
          We encountered an issue fetching details for this section. Check your
          connection or session status.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end pt-2">
        <Button variant="outline" size="sm" onClick={() => resetBoundary()}>
          <RotateCcwIcon className="size-4 mr-2" />
          Retry loading section
        </Button>
      </CardContent>
    </Card>
  );
}
