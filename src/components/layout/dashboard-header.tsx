"use client";

import { Plus } from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useFeedFilter } from "@/hooks/use-feed-filter";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import type { Category, FeedWithSubscription } from "@/types";

/**
 * Client component to render a reactive dashboard header (title and description).
 * Reacts instantly to URL filter changes without a server round-trip.
 */
export function DashboardHeader() {
  const { feedId, categoryId } = useFeedFilter();
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();

  const { title, description } = getHeaderContent(
    feedId,
    categoryId,
    subscriptions,
    categories,
  );

  return (
    <div className="flex items-center justify-between">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      {categoryId && (
        <AssignFeedsDialog categoryId={categoryId}>
          <Button variant="ghost" className="text-md">
            <Plus className="size-6" data-icon="inline-end" />
            Assign
          </Button>
        </AssignFeedsDialog>
      )}
    </div>
  );
}

function getHeaderContent(
  feedId: number | null,
  categoryId: number | null,
  subscriptions: FeedWithSubscription[] = [],
  categories: Category[] = [],
) {
  if (feedId) {
    const sub = subscriptions.find((s) => s.feed.id === feedId);
    if (sub) {
      const title =
        sub.subscription.customTitle || sub.feed.title || "Untitled Feed";
      return { title, description: `Articles from ${title}.` };
    }
  }

  if (categoryId) {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      return {
        title: category.name,
        description: "Your feeds in this category.",
      };
    }
  }

  // Default fallback
  return {
    title: "All Items",
    description: "Everything from your subscriptions in one place.",
  };
}
