import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSubscriptionsSkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 10 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list
        <SidebarMenuItem key={i}>
          <SidebarMenuButton disabled>
            <Skeleton className="size-4 shrink-0 border border-primary/50" />
            <Skeleton className="h-4 flex-1 border border-primary/50" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
