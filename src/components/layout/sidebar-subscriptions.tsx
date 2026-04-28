"use client";

import { ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
                  <SubscriptionLink
                    href={`/dashboard?categoryId=${group.id}`}
                    categoryId={group.id}
                    label={group.name}
                    unreadCount={group.unreadCount}
                    icon={
                      <span
                        className="size-2 rounded-full bg-primary shrink-0"
                        aria-hidden="true"
                      />
                    }
                    suffix={
                      <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground shrink-0" />
                    }
                  />
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
                      <SubscriptionItem
                        key={item.feed.id}
                        item={item}
                        isActive={feedId === item.feed.id}
                        unreadCount={unreadCounts?.feeds?.[item.feed.id] || 0}
                        isSubItem
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
  isSubItem = false,
}: {
  item: FeedWithSubscription;
  isActive: boolean;
  unreadCount: number;
  isSubItem?: boolean;
}) {
  const { subscription, feed } = item;
  const title = subscription.customTitle || feed.title || "Untitled Feed";
  const ItemWrapper = isSubItem ? SidebarMenuSubItem : SidebarMenuItem;
  const ButtonWrapper = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;

  return (
    <ItemWrapper>
      <ButtonWrapper
        asChild
        isActive={isActive}
        tooltip={title}
        className={cn("px-3", isSubItem ? "h-8" : "h-9 relative")}
      >
        <SubscriptionLink
          href={`/dashboard?feedId=${feed.id}`}
          feedId={feed.id}
          label={title}
          unreadCount={unreadCount}
          icon={
            <FeedIcon url={feed.iconUrl || feed.url} title={title} size={20} />
          }
        />
      </ButtonWrapper>
    </ItemWrapper>
  );
}

interface SubscriptionLinkProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof DashboardLink>,
    "children"
  > {
  label: string;
  icon: React.ReactNode;
  unreadCount?: number;
  suffix?: React.ReactNode;
}

function SubscriptionLink({
  label,
  icon,
  unreadCount = 0,
  suffix,
  className,
  ...props
}: SubscriptionLinkProps) {
  return (
    <DashboardLink
      {...props}
      prefetch={false}
      className={cn(className, "grid grid-cols-[1fr_auto]")}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {unreadCount > 0 && (
          <output
            className="text-xs text-muted-foreground group-data-[active=true]/menu-button:text-sidebar-accent-foreground"
            aria-label={`${unreadCount} unread items`}
          >
            {unreadCount}
          </output>
        )}
        {suffix}
      </div>
      <LinkPendingIndicator />
    </DashboardLink>
  );
}
