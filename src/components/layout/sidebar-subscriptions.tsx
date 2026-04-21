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
                >
                  <DashboardLink
                    href={`/dashboard?categoryId=${group.id}`}
                    categoryId={group.id}
                    prefetch={false}
                  >
                    <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-text-tertiary group-data-[collapsible=icon]:hidden" />
                    <FolderIcon />
                    <span>{group.name}</span>
                    <LinkPendingIndicator />
                  </DashboardLink>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {group.unreadCount > 0 && (
                <SidebarMenuBadge className="text-text-tertiary">
                  {group.unreadCount}
                </SidebarMenuBadge>
              )}
              <CollapsibleContent>
                <SidebarMenuSub>
                  {group.items.length === 0 ? (
                    <SidebarMenuSubItem>
                      <div className="px-2 py-1.5 text-xs text-text-tertiary italic">
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
        className="relative"
      >
        <DashboardLink
          href={`/dashboard?feedId=${feed.id}`}
          feedId={feed.id}
          prefetch={false}
        >
          <FeedIcon
            url={feed.iconUrl || feed.url}
            title={title}
            className="size-4 shrink-0"
          />
          <span className="truncate">{title}</span>
          <LinkPendingIndicator />
        </DashboardLink>
      </SidebarMenuButton>
      {unreadCount > 0 && (
        <SidebarMenuBadge className="text-text-tertiary">
          {unreadCount}
        </SidebarMenuBadge>
      )}
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
      <SidebarMenuSubButton asChild isActive={isActive} className="relative">
        <DashboardLink
          href={`/dashboard?feedId=${feed.id}`}
          feedId={feed.id}
          prefetch={false}
        >
          <FeedIcon
            url={feed.iconUrl || feed.url}
            title={title}
            className="size-4 shrink-0"
          />
          <span className="truncate">{title}</span>
          <LinkPendingIndicator />
        </DashboardLink>
      </SidebarMenuSubButton>
      {unreadCount > 0 && (
        <SidebarMenuBadge className="text-text-tertiary">
          {unreadCount}
        </SidebarMenuBadge>
      )}
    </SidebarMenuSubItem>
  );
}
