import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GuestBanner } from "@/components/auth/guest-banner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ClientDialogs } from "@/components/layout/client-dialogs";
import { SidebarErrorFallback } from "@/components/layout/components/sidebar-error-fallback";
import { SidebarFeeds } from "@/components/layout/components/sidebar-feeds";
import { SidebarFeedsSkeleton } from "@/components/layout/components/sidebar-feeds-skeleton";
import {
  MobileBottomNav,
  MobileBottomNavSkeleton,
} from "@/components/layout/mobile-bottom-nav";
import { TopNav } from "@/components/layout/top-nav";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts-dialog";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { SearchShortcutListener } from "@/components/shared/search-shortcut-listener";
import { WelcomeTour } from "@/components/shared/welcome-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getCurrentSession } from "@/lib/session";
import { getCategories } from "@/services/category/get-categories";
import { getUnreadCounts } from "@/services/feed/get-unread-counts";
import { getSubscriptions } from "@/services/subscription/get-subscriptions";
import { getRefreshTaskStatus } from "@/services/system/get-refresh-task-status";
import { shouldShowWelcomeTour } from "@/services/user/should-show-welcome-tour";
import type { SessionPromise } from "@/types";

export const metadata: Metadata = {
  title: {
    template: "%s | Frontpage",
    default: "Frontpage",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const sessionPromise = getCurrentSession();

  queryClient.prefetchQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: async () => {
      const session = await sessionPromise;
      return getSubscriptions(db, session?.user.id ?? "");
    },
  });

  queryClient.prefetchQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const session = await sessionPromise;
      return getCategories(db, session?.user.id ?? "");
    },
  });

  queryClient.prefetchQuery({
    queryKey: queryKeys.unreadCounts.all,
    queryFn: async () => {
      const session = await sessionPromise;
      return getUnreadCounts(db, session?.user.id ?? "");
    },
  });

  queryClient.prefetchQuery({
    queryKey: queryKeys.system.refreshTaskStatus(),
    queryFn: () => getRefreshTaskStatus(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-screen flex-col">
        <TopNav sessionPromise={sessionPromise} />

        <SidebarProvider className="overflow-hidden">
          <AppSidebar>
            <QueryErrorBoundary fallback={<SidebarErrorFallback />}>
              <Suspense fallback={<SidebarFeedsSkeleton />}>
                <SidebarFeeds />
              </Suspense>
            </QueryErrorBoundary>
          </AppSidebar>

          <div className="flex flex-1 flex-col overflow-x-hidden">
            <Suspense fallback={null}>
              <GuestBannerWithSession sessionPromise={sessionPromise} />
            </Suspense>

            <SidebarInset className="flex flex-col p-4 overflow-y-scroll">
              {children}
            </SidebarInset>

            <Suspense fallback={<MobileBottomNavSkeleton />}>
              <MobileBottomNav sessionPromise={sessionPromise} />
            </Suspense>
          </div>

          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <WelcomeTourWithSession sessionPromise={sessionPromise} />
            </Suspense>
          </ErrorBoundary>
        </SidebarProvider>

        <ClientDialogs />
        <SearchShortcutListener />
        <KeyboardShortcutsDialog />
      </div>
    </HydrationBoundary>
  );
}

async function GuestBannerWithSession({
  sessionPromise,
}: {
  sessionPromise: SessionPromise;
}) {
  const session = await sessionPromise;

  if (!session?.user.isAnonymous) {
    return null;
  }

  return <GuestBanner />;
}

async function WelcomeTourWithSession({
  sessionPromise,
}: {
  sessionPromise: SessionPromise;
}) {
  const session = await sessionPromise;

  const showTour = await shouldShowWelcomeTour(db, {
    userId: session?.user.id ?? "",
    isAnonymous: session?.user.isAnonymous,
  });

  if (!showTour) {
    return null;
  }

  return <WelcomeTour />;
}
