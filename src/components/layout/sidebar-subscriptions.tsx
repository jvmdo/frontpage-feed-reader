"use client";

import { ChevronRight, FolderIcon } from "lucide-react";
import * as React from "react";
import { FeedIcon } from "@/components/feed/feed-icon";
import { DashboardLink } from "@/components/shared/dashboard-link";
import { LinkPendingIndicator } from "@/components/shared/link-pending-indicator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import type { FeedWithSubscription } from "@/types";

export function SidebarSubscriptions() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();
  const { data: unreadCounts } = useUnreadCounts();

  const { groups, uncategorized } = React.useMemo(() => {
    const groups = categories.map((category) => ({
      ...category,
      items: subscriptions.filter(
        (s) => s.subscription.categoryId === category.id,
      ),
      unreadCount: unreadCounts?.categories?.[category.id] || 0,
    }));

    const uncategorized = subscriptions.filter(
      (s) => s.subscription.categoryId === null,
    );

    return { groups, uncategorized };
  }, [categories, subscriptions, unreadCounts]);

  if (subscriptions.length === 0 && categories.length === 0) {
    return (
      <div className="px-4 py-2 text-xs text-text-tertiary italic">
        No subscriptions yet.
      </div>
    );
  }

  return (
    <SidebarMenu>
      {groups.map((group) => {
        const hasActiveChild = group.items.some(
          (item) => item.feed.id === feedId,
        );

        return (
          <Collapsible
            key={group.id}
            asChild
            defaultOpen={hasActiveChild || categoryId === group.id}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  asChild
                  tooltip={group.name}
                  isActive={categoryId === group.id}
                  className="h-9 px-3"
                >
                  <DashboardLink
                    href={`/dashboard?categoryId=${group.id}`}
                    categoryId={group.id}
                    prefetch={false}
                    className="grid grid-cols-[1fr_auto]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="size-2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.unreadCount > 0 && (
                        <output
                          className="text-xs text-muted-foreground"
                          aria-label={`${group.unreadCount} unread items`}
                        >
                          {group.unreadCount}
                        </output>
                      )}
                      <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground shrink-0" />
                    </div>
                    <LinkPendingIndicator />
                  </DashboardLink>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-0 mr-0 border-l-0">
                  {group.items.length === 0 ? (
                    <SidebarMenuSubItem>
                      <div className="px-3 py-1.5 text-xs text-text-tertiary italic">
                        No feeds
                      </div>
                    </SidebarMenuSubItem>
                  ) : (
                    group.items.map((item) => (
                      <SubscriptionSubItem
                        key={item.feed.id}
                        item={item}
                        isActive={feedId === item.feed.id}
                        unreadCount={unreadCounts?.feeds?.[item.feed.id] || 0}
                      />
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      })}

      {uncategorized.map((item) => (
        <SubscriptionItem
          key={item.feed.id}
          item={item}
          isActive={feedId === item.feed.id}
          unreadCount={unreadCounts?.feeds?.[item.feed.id] || 0}
        />
      ))}
    </SidebarMenu>
  );
}

function SubscriptionItem({
  item,
  isActive,
  unreadCount,
}: {
  item: FeedWithSubscription;
  isActive: boolean;
  unreadCount: number;
}) {
  const { subscription, feed } = item;
  const title = subscription.customTitle || feed.title || "Untitled Feed";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={title}
        className="h-9 px-3 relative"
      >
        <DashboardLink
          href={`/dashboard?feedId=${feed.id}`}
          feedId={feed.id}
          prefetch={false}
          className="grid grid-cols-[1fr_auto] items-center w-full min-w-0 overflow-hidden"
        >
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="size-5 shrink-0 flex items-center justify-center">
              <FeedIcon
                url={feed.iconUrl || feed.url}
                title={title}
                size={20}
              />
            </div>
            <span className="truncate">{title}</span>
          </div>
          {unreadCount > 0 && (
            <output
              className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0 ml-2 whitespace-nowrap"
              aria-label={`${unreadCount} unread items`}
            >
              {unreadCount}
            </output>
          )}
          <LinkPendingIndicator />
        </DashboardLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SubscriptionSubItem({
  item,
  isActive,
  unreadCount,
}: {
  item: FeedWithSubscription;
  isActive: boolean;
  unreadCount: number;
}) {
  const { subscription, feed } = item;
  const title = subscription.customTitle || feed.title || "Untitled Feed";

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive} className="h-8 px-3">
        <DashboardLink
          href={`/dashboard?feedId=${feed.id}`}
          feedId={feed.id}
          prefetch={false}
          className="grid grid-cols-[1fr_auto]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FeedIcon url={feed.iconUrl || feed.url} title={title} size={20} />

            <span className="truncate">{title}</span>
          </div>
          {unreadCount > 0 && (
            <output
              className="text-xs text-muted-foreground"
              aria-label={`${unreadCount} unread items`}
            >
              {unreadCount}
            </output>
          )}
          <LinkPendingIndicator />
        </DashboardLink>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
