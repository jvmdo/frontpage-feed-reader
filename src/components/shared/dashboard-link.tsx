"use client";

import Link, { type LinkProps, useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { createSerializer } from "nuqs";
import { type ReactNode, useTransition } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { feedFilterParsers } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { FilterStatus } from "@/types";

// Initialize a serializer to generate consistent dashboard URLs
const serialize = createSerializer(feedFilterParsers);

/**
 * Represents the valid state transitions for the dashboard.
 * We omit the Default values and allow partial updates.
 */
type DashboardState = {
  feedId?: number | null;
  categoryId?: number | null;
  saved?: boolean | null;
  status?: FilterStatus | null;
  feedIds?: number[] | null;
};

interface DashboardLinkProps extends Omit<LinkProps, "href"> {
  /** The target state for the dashboard filters */
  state?: DashboardState;
  /** Optional href override if not navigating to the dashboard */
  href?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A robust Link component for dashboard navigation.
 *
 * - Synchronize URL generation (via nuqs serializers)
 * - Perform shallow SPA-like navigation on the dashboard (preventing RSC re-runs)
 * - Handle mobile sidebar behavior
 * - Provide loading feedback via useTransition
 */
export function DashboardLink({
  state,
  href,
  children,
  className,
  ...props
}: DashboardLinkProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { setOpenMobile, isMobile } = useSidebar();
  const { setStates } = useFeedFilter();

  // If a state is provided, generate the /dashboard URL
  // Otherwise, fallback to the provided href
  const targetHref = state
    ? serialize("/dashboard", state)
    : href || "/dashboard";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(e);

    if (isMobile) {
      setOpenMobile(false);
    }

    // Shallow navigation optimization:
    // If we are already on the dashboard and have a target state,
    // intercept the click to update the URL state via nuqs.
    if (pathname === "/dashboard" && state) {
      e.preventDefault();

      setStates(state, { startTransition });
    }
  };

  return (
    <Link
      {...props}
      href={targetHref}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      {children}
      <LinkPendingIndicator isLocalPending={isPending} />
    </Link>
  );
}

function LinkPendingIndicator({ isLocalPending }: { isLocalPending: boolean }) {
  const { pending } = useLinkStatus();

  // Combine Next.js link prefetching/loading status with our local transition status
  const isLoading = pending || isLocalPending;

  if (!isLoading) return null;

  return (
    <span
      aria-hidden
      className="absolute right-2 size-1.5 animate-pulse rounded-full bg-accent"
    />
  );
}
