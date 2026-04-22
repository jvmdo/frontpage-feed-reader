"use client";

import { CheckCheck, Plus } from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useMarkAllRead } from "@/hooks/use-mark-all-read";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import type { UnreadCounts } from "@/services/feed/get-unread-counts";
import type { Category, FeedWithSubscription } from "@/types";

/**
 * Client component to render a reactive dashboard header (title and description).
 * Reacts instantly to URL filter changes without a server round-trip.
 */
export function DashboardHeader() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();
  const { data: unreadCounts } = useUnreadCounts();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const { title, description } = getHeaderContent(
    feedId,
    categoryId,
    subscriptions,
    categories,
    unreadCounts,
  );

  const currentCount = feedId
    ? unreadCounts?.feeds[feedId] || 0
    : categoryId
      ? unreadCounts?.categories[categoryId] || 0
      : unreadCounts?.global || 0;

  const handleMarkAllRead = () => {
    const scope = feedId ? "feed" : categoryId ? "category" : "global";
    const id = feedId || categoryId || undefined;
    markAllRead({ scope, id });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      <div className="flex items-center gap-2 shrink-0">
        {currentCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="text-text-secondary hover:text-text-primary"
              >
                <CheckCheck className="size-4" data-icon="inline-start" />
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark all</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark everything as read?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all articles in{" "}
                  {feedId
                    ? "this feed"
                    : categoryId
                      ? "this category"
                      : "all your subscriptions"}{" "}
                  as read. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAllRead}>
                  Mark all as read
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {categoryId && (
          <AssignFeedsDialog categoryId={categoryId}>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary"
            >
              <Plus className="size-4" data-icon="inline-start" />
              Assign
            </Button>
          </AssignFeedsDialog>
        )}
      </div>
    </div>
  );
}

function getHeaderContent(
  feedId: number | null,
  categoryId: number | null,
  subscriptions: FeedWithSubscription[] = [],
  categories: Category[] = [],
  unreadCounts?: UnreadCounts,
) {
  if (feedId) {
    const sub = subscriptions.find((s) => s.feed.id === feedId);
    if (sub) {
      const baseTitle =
        sub.subscription.customTitle || sub.feed.title || "Untitled Feed";
      const count = unreadCounts?.feeds[feedId] || 0;
      const title =
        count > 0 ? (
          <>
            {baseTitle}{" "}
            <span className="ml-1 text-base font-normal text-text-tertiary">
              {count} unread
            </span>
          </>
        ) : (
          baseTitle
        );
      return { title, description: `Articles from ${baseTitle}.` };
    }
  }

  if (categoryId) {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      const count = unreadCounts?.categories[categoryId] || 0;
      const title =
        count > 0 ? (
          <>
            {category.name}{" "}
            <span className="ml-1 text-base font-normal text-text-tertiary">
              {count} unread
            </span>
          </>
        ) : (
          category.name
        );
      return {
        title,
        description: "Your feeds in this category.",
      };
    }
  }

  // Default fallback (All Items)
  const globalCount = unreadCounts?.global || 0;
  const title =
    globalCount > 0 ? (
      <>
        All Items{" "}
        <span className="ml-1 text-base font-normal text-text-tertiary">
          {globalCount} unread
        </span>
      </>
    ) : (
      "All Items"
    );

  return {
    title,
    description: "Everything from your subscriptions in one place.",
  };
}
