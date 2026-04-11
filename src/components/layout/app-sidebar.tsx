"use client";

import {
  BookmarkIcon,
  InboxIcon,
  PlusIcon,
  RssIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { LinkPendingIndicator } from "@/components/shared/link-pending-indicator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
import type { FeedWithSubscription } from "@/types";
import { SidebarSubscriptions } from "./sidebar-subscriptions";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  subscriptions: FeedWithSubscription[];
}

export function AppSidebar({ subscriptions, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { feedId } = useFeedFilter();

  const isDashboardActive = pathname === "/dashboard" && !feedId;

  return (
    <Sidebar collapsible="icon" {...props}>
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
                  <Link href="/dashboard">
                    <InboxIcon />
                    <span>All Items</span>
                    <LinkPendingIndicator />
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>12</SidebarMenuBadge>
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
          <SidebarGroupContent>
            <SidebarSubscriptions items={subscriptions} />
          </SidebarGroupContent>
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
