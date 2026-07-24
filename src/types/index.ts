import type {
  account,
  categories,
  feedItems,
  feeds,
  session,
  subscriptions,
  user,
  userItemStates,
  userPreferences,
  verification,
} from "@/db/schema";
import type { getCurrentSession } from "@/lib/session";

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type UserItemState = typeof userItemStates.$inferSelect;
export type NewUserItemState = typeof userItemStates.$inferInsert;

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type UpdateFeed = Partial<NewFeed>;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type UpdateCategory = Partial<NewCategory>;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UpdateSubscription = Partial<NewSubscription>;

export type Item = Omit<typeof feedItems.$inferSelect, "rawPayload">;
export type NewItem = typeof feedItems.$inferInsert;
export type UpdateItem = Partial<NewItem>;

export type ListItem = Omit<Item, "content">;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;

export type FeedWithSubscription = {
  feed: Feed;
  subscription: Subscription;
};

export type ItemWithSource = {
  item: Item;
  feed: Feed;
  isRead: boolean;
  isBookmarked: boolean;
  bookmarkedAt: Date | null;
  isExcerpt: boolean;
  categoryName: string | null;
  categoryColor: string | null;
  searchSnippet?: string | null;
  isWatermarked: boolean;
};

export type ListItemWithSource = Omit<ItemWithSource, "item"> & {
  item: ListItem;
};

export type SortOptionId =
  | "recently_saved"
  | "oldest_saved"
  | "newest_published"
  | "oldest_published";

export type SortConfig = {
  sortBy: "publishedAt" | "bookmarkedAt";
  sortOrder: "desc" | "asc";
};

export const FILTER_STATUSES = ["all", "unread", "read"] as const;
export type FilterStatus = (typeof FILTER_STATUSES)[number];

export interface SystemSyncStatus {
  active: boolean;
  isFailing: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface VerifiedFeedResult {
  alreadySubscribed: boolean;
  feed?: Pick<Feed, "title" | "description" | "iconUrl">;
}

export type ServerActionResult<T = undefined> =
  | (T extends undefined
      ? { success: true; data?: never }
      : { success: true; data: T })
  | {
      success: false;
      error: string;
      code: string;
    };

export type SessionPromise = ReturnType<typeof getCurrentSession>;
