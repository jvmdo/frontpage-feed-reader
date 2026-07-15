import type { FilterStatus } from "@/types";

export const queryKeys = {
  categories: {
    all: ["categories"] as const,
  },
  subscriptions: {
    all: ["subscriptions"] as const,
  },
  unreadCounts: {
    all: ["feeds", "unread-counts"] as const,
  },
  system: {
    all: ["system"] as const,
    refreshTaskStatus: () =>
      [...queryKeys.system.all, "refresh-task-status"] as const,
  },
  userAccounts: {
    all: ["user-accounts"] as const,
  },
  feeds: {
    all: ["feeds"] as const,
    items: {
      all: () => [...queryKeys.feeds.all, "items"] as const,
      list: (filters: {
        feedId: number | null;
        categoryId: number | null;
        bookmarkedOnly: boolean;
        status: FilterStatus;
        feedIds: number[];
        sortBy: string;
        sortOrder: string;
      }) => [...queryKeys.feeds.items.all(), filters] as const,
      detail: (itemId: number | null) =>
        [...queryKeys.feeds.items.all(), "detail", itemId] as const,
      search: (search: string) =>
        [...queryKeys.feeds.items.all(), "search", search] as const,
    },
  },
  newItemsCount: {
    all: (
      feedId: number | null,
      categoryId: number | null,
      isUnreadOnly: boolean,
      feedIds: number[],
    ) =>
      ["new-items-count", feedId, categoryId, isUnreadOnly, feedIds] as const,
  },
} as const;
