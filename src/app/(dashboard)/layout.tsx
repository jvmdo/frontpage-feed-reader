import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarErrorFallback } from "@/components/layout/sidebar-error-fallback";
import { SidebarSubscriptions } from "@/components/layout/sidebar-subscriptions";
import { SidebarSubscriptionsSkeleton } from "@/components/layout/sidebar-subscriptions-skeleton";
import { TopNav } from "@/components/layout/top-nav";
import { QueryErrorBoundary } from "@/components/shared/query-error-boundary";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { getQueryClient } from "@/lib/get-query-client";
import { getCurrentSession } from "@/lib/session";
import { getUserCategories } from "@/services/category/get-user-categories";
import { getUnreadCounts } from "@/services/feed/get-unread-counts";
import { getUserSubscriptions } from "@/services/feed/get-user-subscriptions";

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
    queryFn: () => getUserSubscriptions(db, session.user.id),
  });

  queryClient.prefetchQuery({
    queryKey: ["categories"],
    queryFn: () => getUserCategories(db, session.user.id),
  });

  queryClient.prefetchQuery({
    queryKey: ["feeds", "unread-counts"],
    queryFn: () => getUnreadCounts(db, session.user.id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-screen flex-col">
        <TopNav />
        <SidebarProvider className="overflow-hidden">
          <AppSidebar>
            <QueryErrorBoundary fallback={<SidebarErrorFallback />}>
              <Suspense fallback={<SidebarSubscriptionsSkeleton />}>
                <SidebarSubscriptions />
              </Suspense>
            </QueryErrorBoundary>
          </AppSidebar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <SidebarInset className="flex flex-col overflow-hidden">
              <main className="flex-1 min-h-0">{children}</main>
            </SidebarInset>

            <BottomNav />
          </div>
        </SidebarProvider>
      </div>
    </HydrationBoundary>
  );
}
