"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccountForm } from "@/components/user/delete-account-form";
import { EmailChangeForm } from "@/components/user/email-change-form";
import { OAuthProviders } from "@/components/user/oauth-providers";
import { PasswordChangeForm } from "@/components/user/password-change-form";
import { ProfileForm } from "@/components/user/profile-form";
import { authClient, type SessionUser } from "@/lib/auth-client";

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
          <Suspense fallback={<PasswordChangeFormSkeleton />}>
            <EmailChangeForm />
          </Suspense>

          <Suspense fallback={<PasswordChangeFormSkeleton />}>
            <PasswordChangeForm />
          </Suspense>

          <Suspense fallback={<OAuthProvidersSkeleton />}>
            <OAuthProviders />
          </Suspense>
        </>
      )}

      <Suspense fallback={<PasswordChangeFormSkeleton />}>
        <DeleteAccountForm />
      </Suspense>
    </div>
  );
}

export function PasswordChangeFormSkeleton() {
  return (
    <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
      <CardHeader>
        <Skeleton className="h-6 w-36 animate-pulse" />
        <Skeleton className="h-4 w-72 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 animate-pulse" />
            <Skeleton className="h-9 w-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 animate-pulse" />
            <Skeleton className="h-9 w-full animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OAuthProvidersSkeleton() {
  return (
    <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
      <CardHeader>
        <Skeleton className="h-6 w-36 animate-pulse" />
        <Skeleton className="h-4 w-72 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-bg-secondary">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-full animate-pulse" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-12 animate-pulse" />
              <Skeleton className="h-3 w-24 animate-pulse" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileDetailsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Profile Form Card Skeleton */}
      <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
        <CardHeader>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Skeleton className="size-20 rounded-full animate-pulse" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <Skeleton className="h-6 w-48 mx-auto sm:mx-0 animate-pulse" />
              <Skeleton className="h-4 w-32 mx-auto sm:mx-0 animate-pulse" />
              <div className="flex gap-2 pt-2 justify-center sm:justify-start">
                <Skeleton className="h-6 w-24 animate-pulse" />
                <Skeleton className="h-6 w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 animate-pulse" />
              <Skeleton className="h-9 w-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 animate-pulse" />
              <Skeleton className="h-9 w-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeFormSkeleton />
      <OAuthProvidersSkeleton />
    </div>
  );
}
