import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardBreadcrumb } from "@/components/layout/dashboard-breadcrumb";
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

  const subscriptions = await getUserSubscriptions(db, session.user.id);

  return (
    <SidebarProvider>
      <AppSidebar subscriptions={subscriptions} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <Suspense fallback={null}>
                <DashboardBreadcrumb subscriptions={subscriptions} />
              </Suspense>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
