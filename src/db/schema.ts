import { relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_REFRESH_INTERVAL,
} from "@/lib/constants";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),

  refreshInterval: integer("refresh_interval")
    .default(DEFAULT_REFRESH_INTERVAL)
    .notNull(),

  // Watermark for global "Mark all as read"
  markedAllReadAt: timestamp("marked_all_read_at"),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userItemStates = pgTable(
  "user_item_states",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: bigint("item_id", { mode: "number" })
      .notNull()
      .references(() => feedItems.id, { onDelete: "cascade" }),

    readAt: timestamp("read_at"), // If not null, it's explicitly read
    bookmarkedAt: timestamp("bookmarked_at"), // If not null, it's saved for later
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.itemId] }),
    index("idx_user_item_states_bookmarks")
      .on(table.userId)
      .where(sql`${table.bookmarkedAt} IS NOT NULL`),
  ],
);

export const feeds = pgTable("feeds", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title"),
  description: text("description"),
  language: text("language"),
  iconUrl: text("icon_url"),

  lastFetchedAt: timestamp("last_fetched_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastFailureAt: timestamp("last_failure_at"),

  healthStatus: text("health_status").notNull().default("unknown"),

  httpEtag: text("http_etag"),
  httpLastModified: text("http_last_modified"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const categories = pgTable(
  "categories",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default(DEFAULT_CATEGORY_COLOR),

    // Watermark for "Mark category as read"
    markedAllReadAt: timestamp("marked_all_read_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("categories_user_id_name_unique").on(table.userId, table.name),
    index("idx_categories_user").on(table.userId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feedId: bigint("feed_id", { mode: "number" })
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    categoryId: bigint("category_id", { mode: "number" }).references(
      () => categories.id,
      { onDelete: "set null" },
    ),

    customTitle: text("custom_title"),
    ordering: integer("ordering"),

    // Watermark for "Mark feed as read"
    markedAllReadAt: timestamp("marked_all_read_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("subscriptions_user_id_feed_id_unique").on(
      table.userId,
      table.feedId,
    ),
    index("idx_subscriptions_user").on(table.userId),
  ],
);

export const feedItems = pgTable(
  "feed_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    feedId: bigint("feed_id", { mode: "number" })
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),

    guid: text("guid").notNull(),
    url: text("url"),
    title: text("title"),
    description: text("description"),
    content: text("content"),
    author: text("author"),

    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at"),

    textContent: text("text_content"),

    rawPayload: jsonb("raw_payload"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("feed_items_feed_id_guid_unique").on(table.feedId, table.guid),
    index("idx_feed_items_feed_published").on(
      table.feedId,
      table.publishedAt.desc(),
    ),
    index("idx_feed_items_search").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', coalesce(${table.title}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${table.description}, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(${table.textContent}, '')), 'C')
      )`,
    ),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  preferences: one(userPreferences, {
    fields: [user.id],
    references: [userPreferences.userId],
  }),
  itemStates: many(userItemStates),
  categories: many(categories),
  subscriptions: many(subscriptions),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userPreferences.userId],
      references: [user.id],
    }),
  }),
);

export const userItemStatesRelations = relations(userItemStates, ({ one }) => ({
  user: one(user, {
    fields: [userItemStates.userId],
    references: [user.id],
  }),
  item: one(feedItems, {
    fields: [userItemStates.itemId],
    references: [feedItems.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const feedRelations = relations(feeds, ({ many }) => ({
  items: many(feedItems),
  subscriptions: many(subscriptions),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  subscriptions: many(subscriptions),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  feed: one(feeds, {
    fields: [subscriptions.feedId],
    references: [feeds.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}));

export const feedItemRelations = relations(feedItems, ({ one, many }) => ({
  feed: one(feeds, {
    fields: [feedItems.feedId],
    references: [feeds.id],
  }),
  userStates: many(userItemStates),
}));
