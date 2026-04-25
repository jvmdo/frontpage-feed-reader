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

export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;
export type UpdateFeedItem = Partial<NewFeedItem>;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export type FeedWithSubscription = {
  feed: Feed;
  subscription: Subscription;
};

export type FeedItemWithSource = {
  item: FeedItem;
  feed: Feed;
  isRead: boolean;
  isExcerpt: boolean;
  categoryName?: string | null;
};
