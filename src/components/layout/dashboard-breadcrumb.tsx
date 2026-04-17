"use client";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";

/**
 * Client component to render a dynamic breadcrumb that reacts to the current feed filter.
 */
export function DashboardBreadcrumb() {
  const { feedId } = useFeedFilter();
  const { data } = useSubscriptions();

  let pageTitle = "All Items";

  if (feedId) {
    const subWithFeed = data.find((sub) => sub.feed.id === feedId);

    if (subWithFeed) {
      pageTitle =
        subWithFeed.subscription.customTitle ||
        subWithFeed.feed.title ||
        "Untitled Feed";
    }
  }

  return (
    <BreadcrumbList>
      <BreadcrumbItem className="hidden md:block">
        <BreadcrumbLink href="/dashboard">Frontpage</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}
