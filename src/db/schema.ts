import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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
    unique("subscriptions_user_id_feed_id_unique").on(table.userId, table.feedId),
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

    rawPayload: jsonb("raw_payload"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("feed_items_feed_id_guid_unique").on(table.feedId, table.guid),
    index("idx_feed_items_feed_published").on(table.feedId, table.publishedAt.desc()),
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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
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
