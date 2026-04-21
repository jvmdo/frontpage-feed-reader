"use client";

import {
  BookmarkIcon,
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-4">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold">
          F
        </div>
        <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
          Frontpage
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isDashboardActive}
                  tooltip="All Items"
                  className="relative"
                >
                  <DashboardLink href="/dashboard" feedId={null}>
                    <InboxIcon />
                    <span>All Items</span>
                    <LinkPendingIndicator />
                  </DashboardLink>
                </SidebarMenuButton>
                <SidebarMenuBadge>{unreadCounts?.global}</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/saved"}
                  tooltip="Saved"
                >
                  <Link href="/saved">
                    <BookmarkIcon />
                    <span>Saved</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/manage-feeds"}
                  tooltip="Manage Feeds"
                >
                  <Link href="/manage-feeds">
                    <RssIcon />
                    <span>Manage Feeds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <AddCategoryDialog asChild>
                  <SidebarMenuButton tooltip="Add Category">
                    <FolderPlusIcon />
                    <span>Add Category</span>
                  </SidebarMenuButton>
                </AddCategoryDialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <AddFeedDialog asChild>
                  <SidebarMenuButton tooltip="Add Feed">
                    <PlusIcon />
                    <span>Add Feed</span>
                  </SidebarMenuButton>
                </AddFeedDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
          <SidebarGroupAction asChild title="Manage Categories">
            <Link href="/manage-categories">
              <SettingsIcon />
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              tooltip="Settings"
            >
              <a href="/settings">
                <SettingsIcon />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
