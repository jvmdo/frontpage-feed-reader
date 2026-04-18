"use client";

import { FeedIcon } from "@/components/feed/feed-icon";
import { DashboardLink } from "@/components/shared/dashboard-link";
import { LinkPendingIndicator } from "@/components/shared/link-pending-indicator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";

export function SidebarSubscriptions() {
  const { feedId } = useFeedFilter();
  const { data } = useSubscriptions();

  if (data.length === 0) {
    return (
      <div className="px-4 py-2 text-xs text-text-tertiary italic">
        No subscriptions yet.
      </div>
    );
  }

  return (
    <SidebarMenu>
      {data.map(({ subscription, feed }) => {
        const isActive = feedId === feed.id;
        const title = subscription.customTitle || feed.title || "Untitled Feed";

        return (
          <SidebarMenuItem key={feed.id}>
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
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
