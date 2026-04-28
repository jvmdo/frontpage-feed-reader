"use client";

import {
  AlertCircleIcon,
  CircleCheckIcon,
  ClockIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { cn } from "@/lib/utils";
import type { FeedWithSubscription } from "@/types";

/**
 * Represents a rule for determining the aggregate status of feeds.
 * This allows the status logic to be extended without modifying the core component (OCP).
 */
export interface FeedStatusRule {
  predicate: (subscriptions: FeedWithSubscription[]) => boolean;
  resolve: (subscriptions: FeedWithSubscription[]) => {
    label: string;
    icon: LucideIcon;
    iconClassName?: string;
  };
}

const DEFAULT_RULES: FeedStatusRule[] = [
  {
    predicate: (subs) => subs.some((s) => s.feed.healthStatus === "error"),
    resolve: (subs) => {
      const count = subs.filter((s) => s.feed.healthStatus === "error").length;
      return {
        label: `${count} ${count === 1 ? "feed has" : "feeds have"} errors`,
        icon: AlertCircleIcon,
        iconClassName: "text-destructive",
      };
    },
  },
  {
    predicate: (subs) => subs.some((s) => s.feed.healthStatus === "stale"),
    resolve: (subs) => {
      const count = subs.filter((s) => s.feed.healthStatus === "stale").length;
      return {
        label: `${count} ${count === 1 ? "feed is" : "feeds are"} stale`,
        icon: ClockIcon,
        iconClassName: "text-warning",
      };
    },
  },
  {
    predicate: (subs) => subs.length === 0,
    resolve: () => ({
      label: "Manage feeds",
      icon: CircleCheckIcon,
      iconClassName: "text-muted-foreground",
    }),
  },
];

const HEALTHY_FALLBACK = {
  label: "All feeds healthy",
  icon: CircleCheckIcon,
  iconClassName: "text-success",
};

interface FeedStatusProps {
  /**
   * Optional custom rules to override or extend the default status logic.
   */
  rules?: FeedStatusRule[];
}

/**
 * FeedStatus component that displays the aggregate health of all user subscriptions.
 */
export function FeedStatus({ rules = DEFAULT_RULES }: FeedStatusProps) {
  const { data: subscriptions } = useSubscriptions();

  // First predicate to match wins (error has precedence)
  const activeRule = rules.find((rule) => rule.predicate(subscriptions));

  const {
    label,
    icon: Icon,
    iconClassName,
  } = activeRule ? activeRule.resolve(subscriptions) : HEALTHY_FALLBACK;

  return (
    <StatusLink
      href="/manage-feeds"
      ariaLabel={`Feed status: ${label}. Click to manage feeds.`}
    >
      <StatusIcon icon={Icon} className={iconClassName} />
      <span>{label}</span>
    </StatusLink>
  );
}

/**
 * A generic fallback for the FeedStatus component during loading.
 */
export function FeedStatusFallback() {
  return (
    <div className="flex items-center gap-2 px-4 h-12 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden animate-pulse">
      <div className="size-3.5 rounded-full bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  );
}

/* --- Internal Composable Primitives --- */

interface StatusLinkProps {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

function StatusLink({ href, ariaLabel, children, className }: StatusLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 h-12 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function StatusIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return <Icon className={cn("size-3.5", className)} />;
}
