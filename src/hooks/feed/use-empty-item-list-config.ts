"use client";

import { FolderIcon, RssIcon } from "lucide-react";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useFeeds } from "@/hooks/feed/use-feeds";
import type { FilterStatus } from "@/types";

export interface EmptyStateConfig {
  title: string;
  description: string;
  icon: typeof RssIcon;
  actionType?: "show-read" | "show-unread" | "assign-feeds" | null;
}

export interface ConfigContext {
  status: FilterStatus;
  isSaved: boolean;
  categoryId: number | null;
  categoryName: string;
  feedId: number | null;
  feedTitle: string;
}

type EmptyStateScope =
  | "saved-feed"
  | "saved-category"
  | "saved-all"
  | "feed"
  | "category"
  | "all";

/**
 * 2D Configuration Matrix routing status x scope filters to declarative configs.
 * Eliminates nested procedural branching logic and yields clean O(1) resolutions.
 */
const CONFIG_MATRIX: Record<
  FilterStatus,
  Record<EmptyStateScope, (ctx: ConfigContext) => EmptyStateConfig>
> = {
  unread: {
    "saved-category": (ctx) => ({
      title: `No unread saved items in ${ctx.categoryName}`,
      description:
        "You've read all of your bookmarked articles in this category.",
      icon: RssIcon,
      actionType: "show-read",
    }),
    "saved-feed": (ctx) => ({
      title: `No unread saved items from ${ctx.feedTitle}`,
      description:
        "You've read all of your bookmarked articles from this source.",
      icon: RssIcon,
      actionType: "show-read",
    }),
    "saved-all": () => ({
      title: "No unread saved items",
      description: "You've read all of your bookmarked articles.",
      icon: RssIcon,
      actionType: "show-read",
    }),
    category: (ctx) => ({
      title: `All caught up in ${ctx.categoryName}`,
      description: "There are no unread articles in this category right now.",
      icon: RssIcon,
      actionType: "show-read",
    }),
    feed: (ctx) => ({
      title: `All caught up in ${ctx.feedTitle}`,
      description: "There are no unread articles from this source right now.",
      icon: RssIcon,
      actionType: "show-read",
    }),
    all: () => ({
      title: "You're all caught up!",
      description: "There are no unread articles in your feed right now.",
      icon: RssIcon,
      actionType: "show-read",
    }),
  },
  read: {
    "saved-category": (ctx) => ({
      title: `No read saved items in ${ctx.categoryName}`,
      description:
        "You haven't read any of your bookmarked articles in this category yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
    "saved-feed": (ctx) => ({
      title: `No read saved items from ${ctx.feedTitle}`,
      description:
        "You haven't read any of your bookmarked articles from this source yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
    "saved-all": () => ({
      title: "No read saved items",
      description: "You haven't read any of your bookmarked articles yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
    category: (ctx) => ({
      title: `No read articles in ${ctx.categoryName}`,
      description: "You haven't read any articles in this category yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
    feed: (ctx) => ({
      title: `No read articles from ${ctx.feedTitle}`,
      description: "You haven't read any articles from this source yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
    all: () => ({
      title: "No read articles",
      description: "You haven't read any articles yet.",
      icon: RssIcon,
      actionType: "show-unread",
    }),
  },
  all: {
    "saved-category": (ctx) => ({
      title: `No saved items in ${ctx.categoryName}`,
      description: "You haven't bookmarked any articles in this category yet.",
      icon: RssIcon,
    }),
    "saved-feed": (ctx) => ({
      title: `No saved items from ${ctx.feedTitle}`,
      description: "You haven't bookmarked any articles from this source yet.",
      icon: RssIcon,
    }),
    "saved-all": () => ({
      title: "No saved items yet",
      description:
        "Articles you bookmark for later will appear here, even after they've been read.",
      icon: RssIcon,
    }),
    category: (ctx) => ({
      title: `${ctx.categoryName} has no items yet`,
      description:
        "There are no feeds assigned to this category or the assigned feeds haven't published anything yet.",
      icon: FolderIcon,
      actionType: "assign-feeds",
    }),
    feed: (ctx) => ({
      title: `${ctx.feedTitle} is empty`,
      description:
        "This feed doesn't have any articles yet, or they haven't been fetched.",
      icon: RssIcon,
    }),
    all: () => ({
      title: "Your feed is empty",
      description:
        "Subscribe to more feeds or refresh your current ones to see new articles here.",
      icon: RssIcon,
    }),
  },
};

/**
 * Pure helper function to resolve current scope key and query the 2D configuration matrix.
 */
function getEmptyStateConfig(ctx: ConfigContext): EmptyStateConfig {
  const { status, isSaved, categoryId, feedId } = ctx;

  let scope: EmptyStateScope = "all";
  if (isSaved) {
    if (feedId) scope = "saved-feed";
    else if (categoryId) scope = "saved-category";
    else scope = "saved-all";
  } else {
    if (feedId) scope = "feed";
    else if (categoryId) scope = "category";
  }

  return CONFIG_MATRIX[status][scope](ctx);
}

export function useEmptyItemListConfig() {
  const { feedId, categoryId, isSaved, status, setStatus, feedIds } =
    useFeedFilter();
  const { data: categories } = useCategories();
  const { data: subscriptions } = useFeeds();

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name || "This category";

  const activeFeedId =
    isSaved && feedIds && feedIds.length > 0 ? feedIds[0] : feedId;

  const subscription = subscriptions?.find(
    (s) => s.subscription.feedId === activeFeedId,
  );
  const feedTitle =
    subscription?.subscription.customTitle ||
    subscription?.feed.title ||
    "This feed";

  const config = getEmptyStateConfig({
    status,
    isSaved,
    categoryId,
    categoryName,
    feedId: activeFeedId,
    feedTitle,
  });

  return {
    config,
    categoryId,
    onShowRead: () => setStatus("all"),
    onShowUnread: () => setStatus("unread"),
  };
}
