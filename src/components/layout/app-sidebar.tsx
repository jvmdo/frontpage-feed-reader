"use client";

import {
  BookmarkIcon,
  CircleCheckIcon,
  FolderPlusIcon,
  InboxIcon,
  PlusIcon,
  RssIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AddCategoryDialog } from "@/components/category/add-category-dialog";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { DashboardLink } from "@/components/shared/dashboard-link";
import { LinkPendingIndicator } from "@/components/shared/link-pending-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useUnreadCounts } from "@/hooks/use-unread-counts";

export function AppSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { feedId, categoryId } = useFeedFilter();
  const { data: unreadCounts } = useUnreadCounts();

  const isDashboardActive = pathname === "/dashboard" && !feedId && !categoryId;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border"
      style={
        { top: "3.5rem", height: "calc(100vh - 3.5rem)" } as React.CSSProperties
      }
    >
      <SidebarHeader className="h-14 flex flex-row items-center gap-2 px-4 group-data-[collapsible=icon]:hidden md:hidden">
        <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shrink-0">
          <RssIcon className="size-4" />
        </div>
        <span className="text-lg font-serif italic tracking-tight text-foreground truncate">
          Frontpage
        </span>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isDashboardActive}
                    tooltip="All Items"
                    className="relative font-medium"
                  >
                    <DashboardLink href="/dashboard" feedId={null}>
                      <InboxIcon className="size-4" />
                      <span>All Items</span>
                      <LinkPendingIndicator />
                    </DashboardLink>
                  </SidebarMenuButton>
                  {unreadCounts?.global && unreadCounts.global > 0 ? (
                    <SidebarMenuBadge className="bg-primary/10 text-primary font-semibold border-0">
                      {unreadCounts.global}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/saved"}
                    tooltip="Saved"
                    className="relative font-medium"
                  >
                    <Link href="/saved">
                      <BookmarkIcon className="size-4" />
                      <span>Saved</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <AddCategoryDialog asChild>
                    <SidebarMenuButton tooltip="Add Category">
                      <FolderPlusIcon className="size-4" />
                      <span>Add Category</span>
                    </SidebarMenuButton>
                  </AddCategoryDialog>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <AddFeedDialog asChild>
                    <SidebarMenuButton tooltip="Add Feed">
                      <PlusIcon className="size-4" />
                      <span>Add Feed</span>
                    </SidebarMenuButton>
                  </AddFeedDialog>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscriptions
            </SidebarGroupLabel>
            <SidebarGroupAction asChild title="Manage Categories">
              <Link href="/manage-categories">
                <SettingsIcon className="size-4" />
              </Link>
            </SidebarGroupAction>
            <SidebarGroupContent>{children}</SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-0 border-t border-border">
        <Link
          href="/manage-feeds"
          className="flex items-center gap-2 px-4 h-12 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
        >
          <CircleCheckIcon className="size-3.5 text-success" />
          <span>All feeds healthy</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
