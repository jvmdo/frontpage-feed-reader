import {
  defaultShouldDehydrateQuery,
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardBreadcrumb } from "@/components/layout/dashboard-breadcrumb";
import { DashboardBreadcrumbSkeleton } from "@/components/layout/dashboard-breadcrumb-skeleton";
import { SidebarSubscriptions } from "@/components/layout/sidebar-subscriptions";
import { SidebarSubscriptionsSkeleton } from "@/components/layout/sidebar-subscriptions-skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
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

  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });

  queryClient.prefetchQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getUserSubscriptions(db, session.user.id),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AppSidebar>
          <Suspense fallback={<SidebarSubscriptionsSkeleton />}>
            <SidebarSubscriptions />
          </Suspense>
        </AppSidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Suspense fallback={<DashboardBreadcrumbSkeleton />}>
                <Breadcrumb>
                  <DashboardBreadcrumb />
                </Breadcrumb>
              </Suspense>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
