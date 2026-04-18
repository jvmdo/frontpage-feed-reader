"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useFeedFilter } from "@/hooks/use-feed-filter";

interface DashboardLinkProps extends LinkProps {
  feedId?: number | null;
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
  children,
  ...props
}: DashboardLinkProps) {
  const pathname = usePathname();
  const { setFeedId } = useFeedFilter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If we are already on the dashboard, intercept the click to do a shallow update
    if (pathname === "/dashboard") {
      e.preventDefault();
      setFeedId(feedId);
    }
    // Otherwise, let the standard Link navigation happen
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
