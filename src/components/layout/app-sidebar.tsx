"use client";

import {
  BookmarkIcon,
  HashIcon,
  InboxIcon,
  PlusIcon,
  RssIcon,
  SettingsIcon,
} from "lucide-react";
import type * as React from "react";
import { usePathname } from "next/navigation";

import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

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
                  isActive={pathname === "/dashboard"}
                  tooltip="All Items"
                >
                  <a href="/dashboard">
                    <InboxIcon />
                    <span>All Items</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>12</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/saved"}
                  tooltip="Saved"
                >
                  <a href="/saved">
                    <BookmarkIcon />
                    <span>Saved</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/manage-feeds"}
                  tooltip="Manage Feeds"
                >
                  <a href="/manage-feeds">
                    <RssIcon />
                    <span>Manage Feeds</span>
                  </a>
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
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Frontend">
                  <HashIcon />
                  <span>Frontend</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>5</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Design">
                  <HashIcon />
                  <span>Design</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
