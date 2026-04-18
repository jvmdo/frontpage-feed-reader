import { DashboardLink } from "@/components/shared/dashboard-link";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardBreadcrumbSkeleton() {
  return (
    <BreadcrumbList>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink asChild>
          <DashboardLink href="/dashboard" feedId={null}>
            Frontpage
          </DashboardLink>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <Skeleton className="h-4 w-24" />
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}
