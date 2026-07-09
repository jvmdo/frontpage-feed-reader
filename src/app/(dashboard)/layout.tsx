import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GuestBanner } from "@/components/auth/guest-banner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ClientDialogs } from "@/components/layout/client-dialogs";
import { SidebarErrorFallback } from "@/components/layout/components/sidebar-error-fallback";
import { SidebarFeeds } from "@/components/layout/components/sidebar-feeds";
import { SidebarFeedsSkeleton } from "@/components/layout/components/sidebar-feeds-skeleton";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopNav } from "@/components/layout/top-nav";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts-dialog";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { SearchShortcutListener } from "@/components/shared/search-shortcut-listener";
import { WelcomeTour } from "@/components/shared/welcome-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { getCategories } from "@/services/category/get-categories";
import { getUnreadCounts } from "@/services/feed/get-unread-counts";
import { getSubscriptions } from "@/services/subscription/get-subscriptions";
import { getRefreshTaskStatus } from "@/services/system/get-refresh-task-status";
import { shouldShowWelcomeTour } from "@/services/user/should-show-welcome-tour";

export const metadata: Metadata = {
  title: {
    default: "App",
    template: "%s | Frontpage",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();

  queryClient.prefetchQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(db, session.user.id),
  });

  queryClient.prefetchQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(db, session.user.id),
  });

  queryClient.prefetchQuery({
    queryKey: ["feeds", "unread-counts"],
    queryFn: () => getUnreadCounts(db, session.user.id),
  });

  queryClient.prefetchQuery({
    queryKey: ["system", "refresh-task-status"],
    queryFn: () => getRefreshTaskStatus(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-screen flex-col">
        <TopNav user={session.user} />

        <SidebarProvider className="overflow-hidden">
          <AppSidebar>
            <QueryErrorBoundary fallback={<SidebarErrorFallback />}>
              <Suspense fallback={<SidebarFeedsSkeleton />}>
                <SidebarFeeds />
              </Suspense>
            </QueryErrorBoundary>
          </AppSidebar>
          <div className="flex flex-1 flex-col overflow-x-hidden">
            {session.user.isAnonymous && <GuestBanner />}

            <SidebarInset className="flex flex-col p-4 overflow-y-scroll">
              {children}
            </SidebarInset>

            <MobileBottomNav user={session.user} />
          </div>
          <Suspense fallback={null}>
            <CheckWelcomeTour
              userId={session.user.id}
              isAnonymous={session.user.isAnonymous}
            />
          </Suspense>
        </SidebarProvider>

        <ClientDialogs />
        <SearchShortcutListener />
        <KeyboardShortcutsDialog />
      </div>
    </HydrationBoundary>
  );
}

async function CheckWelcomeTour({
  userId,
  isAnonymous,
}: {
  userId: string;
  isAnonymous: boolean | null | undefined;
}) {
  const showTour = await shouldShowWelcomeTour(db, { userId, isAnonymous });

  if (!showTour) return null;

  return <WelcomeTour />;
}
