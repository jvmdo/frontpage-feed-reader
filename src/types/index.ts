import type {
  account,
  categories,
  feeds,
  session,
  subscriptions,
  user,
  verification,
} from "@/db/schema";

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;