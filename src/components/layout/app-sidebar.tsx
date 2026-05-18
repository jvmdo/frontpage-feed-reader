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
import { type ReactNode, Suspense } from "react";
import { AddCategoryDialog } from "@/components/category/add-category-dialog";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import {
  FeedStatus,
  FeedStatusFallback,
} from "@/components/layout/components/feed-status";
import { DashboardLink } from "@/components/shared/dashboard-link";
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
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useUnreadCounts } from "@/hooks/feed/use-unread-counts";
import { dashboardState } from "@/lib/search-params";

export function AppSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { feedId, categoryId, isSaved } = useFeedFilter();

  const isDashboardActive =
    pathname === "/dashboard" && !feedId && !categoryId && !isSaved;

  const isSavedActive = pathname === "/dashboard" && isSaved;

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
                    <DashboardLink state={dashboardState.allItems()}>
                      <InboxIcon className="size-4" />
                      <span>All Items</span>
                    </DashboardLink>
                  </SidebarMenuButton>
                  <Suspense fallback={null}>
                    <AllItemsBadge />
                  </Suspense>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isSavedActive}
                    tooltip="Saved"
                    className="relative font-medium"
                  >
                    <DashboardLink state={dashboardState.saved()}>
                      <BookmarkIcon className="size-4" />
                      <span>Saved</span>
                    </DashboardLink>
                  </SidebarMenuButton>
                  <Suspense fallback={null}>
                    <SavedItemsBadge />
                  </Suspense>
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
                    <SidebarMenuButton
                      tooltip="Add Category"
                      data-tour="add-category"
                    >
                      <FolderPlusIcon className="size-4" />
                      <span>Add Category</span>
                    </SidebarMenuButton>
                  </AddCategoryDialog>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <AddFeedDialog asChild>
                    <SidebarMenuButton tooltip="Add Feed" data-tour="add-feed">
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
              Feeds
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
        <Suspense fallback={<FeedStatusFallback />}>
          <FeedStatus />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

function AllItemsBadge() {
  const { data: unreadCounts } = useUnreadCounts();

  if (!unreadCounts?.global || unreadCounts.global <= 0) {
    return null;
  }

  return (
    <SidebarMenuBadge className="font-semibold border-0">
      <output aria-label={`${unreadCounts.global} unread items`}>
        {unreadCounts.global}
      </output>
    </SidebarMenuBadge>
  );
}

function SavedItemsBadge() {
  const { data: unreadCounts } = useUnreadCounts();

  if (!unreadCounts?.saved || unreadCounts.saved <= 0) {
    return null;
  }

  return (
    <SidebarMenuBadge className="font-semibold border-0">
      <output aria-label={`${unreadCounts.saved} unread saved items`}>
        {unreadCounts.saved}
      </output>
    </SidebarMenuBadge>
  );
}
