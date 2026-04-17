"use client";

import Link from "next/link";
import { FeedIcon } from "@/components/feed/feed-icon";
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
              <Link href={`/dashboard?feedId=${feed.id}`} prefetch={false}>
                <FeedIcon
                  url={feed.iconUrl || feed.url}
                  title={title}
                  className="size-4 shrink-0"
                />
                <span className="truncate">{title}</span>
                <LinkPendingIndicator />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
