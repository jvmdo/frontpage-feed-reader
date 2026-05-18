"use client";

import Link, { type LinkProps, useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { saveItemsListScroll } from "@/lib/scroll-store";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface DashboardLinkProps extends LinkProps {
  feedId?: number | null;
  categoryId?: number | null;
  saved?: boolean | null;
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
  saved = null,
  children,
  className,
  ...props
}: DashboardLinkProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const {
    feedId: currentFeedId,
    categoryId: currentCategoryId,
    isSaved: currentIsSaved,
    setFeedId,
    setCategoryId,
    goToSaved,
  } = useFeedFilter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call the original onClick if it exists (e.g. from a CollapsibleTrigger)
    props.onClick?.(e);

    // If on mobile, close the sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }

    // If we are already on the dashboard, intercept the click to do a shallow update
    if (pathname === "/dashboard") {
      e.preventDefault();

      saveItemsListScroll(currentFeedId || currentCategoryId || (currentIsSaved ? "saved" : null));

      if (saved === true) {
        goToSaved();
      } else if (categoryId !== null) {
        setCategoryId(categoryId);
      } else {
        setFeedId(feedId);
      }
    }
    // Otherwise, let the standard Link navigation happen
  };

  return (
    <Link
      {...props}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      {children}
      <LinkPendingIndicator />
    </Link>
  );
}

function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden
      className="absolute right-2 size-1.5 animate-pulse rounded-full bg-accent"
    />
  );
}
