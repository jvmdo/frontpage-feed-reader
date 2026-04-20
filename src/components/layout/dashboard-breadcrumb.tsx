"use client";

import * as React from "react";
import { DashboardLink } from "@/components/shared/dashboard-link";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";

type BreadcrumbInfo = {
  label: string;
  href?: string;
  categoryId?: number;
  feedId?: number | null;
  isPage?: boolean;
};

export function DashboardBreadcrumb() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();

  const breadcrumbs = React.useMemo(() => {
    // 1. Resolve active entities upfront (with optional chaining for safety)
    const activeFeed = feedId
      ? subscriptions?.find((sub) => sub.feed.id === feedId)
      : null;

    const targetCategoryId = activeFeed?.subscription?.categoryId || categoryId;

    const activeCategory = targetCategoryId
      ? categories?.find((cat) => cat.id === targetCategoryId)
      : null;

    // 2. Declaratively build the breadcrumb trail linearly
    const items: Array<BreadcrumbInfo> = [
      { label: "Frontpage", href: "/dashboard", feedId: null },
    ];

    if (activeCategory) {
      items.push({
        label: activeCategory.name,
        // If there's an active feed, the category acts as a link. Otherwise, it's the current page.
        isPage: !activeFeed,
        ...(activeFeed && {
          href: `/dashboard?categoryId=${activeCategory.id}`,
          categoryId: activeCategory.id,
        }),
      });
    }

    if (activeFeed) {
      items.push({
        label:
          activeFeed.subscription?.customTitle ||
          activeFeed.feed?.title ||
          "Untitled Feed",
        isPage: true,
      });
    }

    // 3. Fallback state
    if (!activeCategory && !activeFeed) {
      items.push({ label: "All Items", isPage: true });
    }

    return items;
  }, [feedId, categoryId, subscriptions, categories]);

  return (
    <BreadcrumbList className="flex-nowrap">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const mobileHiddenClass = index === 0 ? "hidden md:block" : "";

        return (
          <React.Fragment key={item.label}>
            <BreadcrumbItem className={`min-w-0 ${mobileHiddenClass}`}>
              {item.isPage ? (
                <BreadcrumbPage className="truncate">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="truncate">
                  <DashboardLink
                    href={item.href!}
                    categoryId={item.categoryId}
                    feedId={item.feedId}
                  >
                    {item.label}
                  </DashboardLink>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator className={mobileHiddenClass} />}
          </React.Fragment>
        );
      })}
    </BreadcrumbList>
  );
}
