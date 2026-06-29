import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  UserStatsGrid,
  UserStatsGridSkeleton,
} from "@/components/user/user-stats-grid";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { getUserStats } from "@/services/user/get-user-stats";
import { ProfileClient } from "../../../components/user/profile-client";

/**
 * Server component for the Profile route.
 * Renders the static shell immediately and streams stats and details concurrently.
 */
export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  const headersList = await headers();

  queryClient.prefetchQuery({
    queryKey: ["user-accounts"],
    queryFn: () => auth.api.listUserAccounts({ headers: headersList }),
  });

  return (
    <section className="flex flex-col gap-6" aria-labelledby="profile-title">
      <header className="flex flex-col gap-1">
        <h1
          id="profile-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal details, credentials, and view account
          statistics.
        </p>
      </header>

      <div className="space-y-8">
        <Suspense fallback={<UserStatsGridSkeleton />}>
          <UserStatsGridContainer userId={session.user.id} />
        </Suspense>

        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProfileClient user={session.user} />
        </HydrationBoundary>
      </div>
    </section>
  );
}

/**
 * Server component wrapper that queries user stats.
 */
async function UserStatsGridContainer({ userId }: { userId: string }) {
  const stats = await getUserStats(db, userId);
  return <UserStatsGrid stats={stats} />;
}
