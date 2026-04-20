"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { saveFeedScroll } from "@/lib/feed/scroll-store";

interface DashboardLinkProps extends LinkProps {
  feedId?: number | null;
  categoryId?: number | null;
  children: ReactNode;
  className?: string;
}

/**
 * A specialized Link component for dashboard navigation.
 * If already on the dashboard, it performs a shallow state update to preserve
 * the TanStack Query cache and scroll position.
 */
export function DashboardLink({
  feedId = null,
  categoryId = null,
  children,
  ...props
}: DashboardLinkProps) {
  const pathname = usePathname();
  const {
    feedId: currentFeedId,
    categoryId: currentCategoryId,
    setFeedId,
    setCategoryId,
  } = useFeedFilter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call the original onClick if it exists (e.g. from a CollapsibleTrigger)
    props.onClick?.(e);

    // If we are already on the dashboard, intercept the click to do a shallow update
    if (pathname === "/dashboard") {
      e.preventDefault();

      saveFeedScroll(currentFeedId || currentCategoryId);

      if (categoryId !== null) {
        setCategoryId(categoryId);
      } else {
        setFeedId(feedId);
      }
    }
    // Otherwise, let the standard Link navigation happen
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
