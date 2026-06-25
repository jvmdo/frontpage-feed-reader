"use client";

import { ChevronRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { CategoryDot } from "@/components/category/category-dot";
import { FeedIcon } from "@/components/feed/feed-icon";
import { DashboardLink } from "@/components/shared/dashboard-link";
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
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";
import { useUnreadCounts } from "@/hooks/feed/use-unread-counts";
import { WELCOME_FEED_URL } from "@/lib/constants";
import { dashboardState } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { Category, FeedWithSubscription } from "@/types";

export function SidebarFeeds() {
  const { data: feeds } = useFeeds();
  const { data: categories } = useCategories();

  const groups = categories.map((category) => ({
    ...category,
    items: feeds.filter((s) => s.subscription.categoryId === category.id),
  }));

  const uncategorized = feeds.filter((s) => s.subscription.categoryId === null);

  if (feeds.length === 0 && categories.length === 0) {
    return (
      <div className="px-4 py-2 text-xs text-text-tertiary italic">
        No feeds yet.
      </div>
    );
  }

  return (
    <SidebarMenu>
      {uncategorized.map((item) => (
        <SidebarFeedItem
          key={item.feed.id}
          item={item}
          data-tour={
            item.feed.url === WELCOME_FEED_URL ? "welcome-feed" : undefined
          }
        />
      ))}

      {groups.map((group) => (
        <CategoryGroup key={group.id} category={group} items={group.items} />
      ))}
    </SidebarMenu>
  );
}

function CategoryGroup({
  category,
  items,
}: {
  category: Category;
  items: FeedWithSubscription[];
}) {
  const { categoryId } = useFeedFilter();
  const { data: unreadCounts } = useUnreadCounts();

  const isActive = categoryId === category.id;
  const unreadCount = unreadCounts?.categories?.[category.id] || 0;

  return (
    <Collapsible asChild defaultOpen={true} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            asChild
            tooltip={category.name}
            isActive={isActive}
            className="h-9 px-3"
          >
            <FeedLink
              state={dashboardState.category(category.id)}
              label={category.name}
              unreadCount={unreadCount}
              icon={<CategoryDot color={category.color} />}
              suffix={
                <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground shrink-0" />
              }
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-0 mr-0 border-l-0">
            {items.length === 0 ? (
              <SidebarMenuSubItem>
                <div className="px-3 py-1.5 text-xs text-text-tertiary italic">
                  No feeds
                </div>
              </SidebarMenuSubItem>
            ) : (
              items.map((item) => (
                <SidebarFeedSubItem
                  key={item.feed.id}
                  item={item}
                  categoryColor={category.color}
                />
              ))
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/**
 * Shared logic for resolving feed display state in the sidebar.
 */
function useSidebarFeed(item: FeedWithSubscription) {
  const { feedId } = useFeedFilter();
  const { data: unreadCounts } = useUnreadCounts();

  const { subscription, feed } = item;
  const title = subscription.customTitle || feed.title || "Untitled Feed";
  const isActive = feedId === feed.id;
  const unreadCount = unreadCounts?.feeds?.[feed.id] || 0;

  return { title, isActive, unreadCount, feed };
}
function SidebarFeedItem({
  item,
  "data-tour": dataTour,
}: {
  item: FeedWithSubscription;
  "data-tour"?: string;
}) {
  const { title, isActive, unreadCount, feed } = useSidebarFeed(item);

  return (
    <SidebarMenuItem data-tour={dataTour}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={title}
        className="h-9 px-3 relative"
      >
        <FeedLink
          state={dashboardState.feed(feed.id)}
          label={title}
          unreadCount={unreadCount}
          icon={
            <FeedIcon url={feed.iconUrl || feed.url} title={title} size={20} />
          }
        />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarFeedSubItem({
  item,
  categoryColor,
}: {
  item: FeedWithSubscription;
  categoryColor?: string | null;
}) {
  const { title, isActive, unreadCount, feed } = useSidebarFeed(item);

  return (
    <SidebarMenuSubItem
      data-tour={feed.url === WELCOME_FEED_URL ? "welcome-feed" : undefined}
    >
      <SidebarMenuSubButton asChild isActive={isActive} className="h-8 px-3">
        <FeedLink
          state={dashboardState.feed(feed.id)}
          label={title}
          unreadCount={unreadCount}
          icon={
            <FeedIcon
              url={feed.iconUrl || feed.url}
              title={title}
              size={20}
              categoryColor={categoryColor}
            />
          }
        />
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

interface FeedLinkProps
  extends Omit<ComponentProps<typeof DashboardLink>, "children"> {
  label: string;
  icon: ReactNode;
  unreadCount?: number;
  suffix?: ReactNode;
}

function FeedLink({
  label,
  icon,
  unreadCount = 0,
  suffix,
  className,
  ...props
}: FeedLinkProps) {
  return (
    <DashboardLink
      {...props}
      prefetch={false}
      className={cn(className, "grid grid-cols-[1fr_auto] items-center")}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        {unreadCount > 0 && (
          <output
            className="text-xs text-muted-foreground group-data-[active=true]/menu-button:text-sidebar-accent-foreground group-data-[active=true]/menu-sub-button:text-sidebar-accent-foreground"
            aria-label={`${unreadCount} unread items`}
          >
            {unreadCount}
          </output>
        )}
        {suffix}
      </div>
    </DashboardLink>
  );
}
