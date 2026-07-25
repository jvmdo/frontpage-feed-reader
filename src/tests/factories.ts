import { DEFAULT_CATEGORY_COLOR } from "@/lib/constants";
import { isExcerpt } from "@/lib/feed/utils";
import type {
  Account,
  Category,
  Feed,
  FeedWithSubscription,
  Item,
  ItemWithSource,
  ListItem,
  ListItemWithSource,
  SessionPromise,
  Subscription,
  User,
} from "@/types";

export function createMockFeed(overrides: Partial<Feed> = {}): Feed {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    url: `https://example.com/feed-${id}`,
    title: `Mock Feed ${id}`,
    description: "A description for the mock feed",
    language: "en",
    iconUrl: null,
    lastFetchedAt: new Date(),
    lastSuccessAt: new Date(),
    lastFailureAt: null,
    healthStatus: "healthy",
    isCurated: false,
    httpEtag: null,
    httpLastModified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCategory(
  overrides: Partial<Category> = {},
): Category {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    userId: "user-1",
    name: `Category ${id}`,
    color: DEFAULT_CATEGORY_COLOR,
    markedAllReadAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockSubscription(
  overrides: Partial<Subscription> = {},
): Subscription {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    userId: "user-1",
    feedId: Math.floor(Math.random() * 1000),
    categoryId: null,
    customTitle: null,
    ordering: 0,
    markedAllReadAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockFeedWithSubscription(
  overrides: Partial<{
    feed: Partial<Feed>;
    subscription: Partial<Subscription>;
  }> = {},
): FeedWithSubscription {
  const feed = createMockFeed(overrides.feed);
  const subscription = createMockSubscription({
    feedId: feed.id,
    ...overrides.subscription,
  });

  return {
    feed,
    subscription,
  };
}

export function createMockItem(overrides: Partial<Item> = {}): Item {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    feedId: Math.floor(Math.random() * 1000),
    guid: `guid-${id}`,
    url: `https://example.com/item-${id}`,
    title: `Mock Item ${id}`,
    description: "A description for the mock item",
    content: "Full content for the mock item",
    textContent: null,
    author: "Author Name",
    publishedAt: new Date(),
    updatedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockListItem(
  overrides: Partial<ListItem> = {},
): ListItem {
  const { content: _content, ...item } = createMockItem(overrides);
  return item;
}

export function createMockItemWithSource(
  overrides: Partial<{
    item: Partial<Item>;
    feed: Partial<Feed>;
    isRead: boolean;
    isBookmarked?: boolean;
    bookmarkedAt?: Date | null;
    isExcerpt?: boolean;
    categoryName?: string | null;
    categoryColor?: string | null;
    searchSnippet?: string | null;
    isWatermarked?: boolean;
  }> = {},
): ItemWithSource {
  const feed = createMockFeed(overrides.feed);
  const item = createMockItem({
    feedId: feed.id,
    ...overrides.item,
  });

  return {
    item,
    feed,
    isRead: overrides.isRead ?? false,
    isBookmarked: overrides.isBookmarked ?? false,
    bookmarkedAt: overrides.bookmarkedAt ?? null,
    isExcerpt: overrides.isExcerpt ?? isExcerpt(item),
    categoryName: overrides.categoryName ?? null,
    categoryColor: overrides.categoryColor ?? null,
    searchSnippet: overrides.searchSnippet ?? null,
    isWatermarked: overrides.isWatermarked ?? false,
  };
}

export function createMockListItemWithSource(
  overrides: Partial<{
    item: Partial<ListItem>;
    feed: Partial<Feed>;
    isRead: boolean;
    isBookmarked?: boolean;
    bookmarkedAt?: Date | null;
    isExcerpt?: boolean;
    categoryName?: string | null;
    categoryColor?: string | null;
    searchSnippet?: string | null;
    isWatermarked?: boolean;
  }> = {},
): ListItemWithSource {
  const feed = createMockFeed(overrides.feed);
  const item = createMockListItem({
    feedId: feed.id,
    ...overrides.item,
  });

  return {
    item,
    feed,
    isRead: overrides.isRead ?? false,
    isBookmarked: overrides.isBookmarked ?? false,
    bookmarkedAt: overrides.bookmarkedAt ?? null,
    isExcerpt: overrides.isExcerpt ?? isExcerpt(item),
    categoryName: overrides.categoryName ?? null,
    categoryColor: overrides.categoryColor ?? null,
    searchSnippet: overrides.searchSnippet ?? null,
    isWatermarked: overrides.isWatermarked ?? false,
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? `user-${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    name: "John Doe",
    email: "john@example.com",
    emailVerified: true,
    image: null,
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAccount(overrides: Partial<Account> = {}): Account {
  const id = overrides.id ?? `acc-${Math.floor(Math.random() * 1000)}`;
  const userId = overrides.userId ?? "user-1";
  return {
    id,
    userId,
    accountId: overrides.accountId ?? userId,
    providerId: overrides.providerId ?? "credential",
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockSessionPromise(
  user = createMockUser(),
): SessionPromise {
  const result = {
    session: {
      id: "session-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      expiresAt: new Date(),
      token: "token-1",
    },
    user,
  };
  const promise = Promise.resolve(result) as unknown as SessionPromise & {
    status?: string;
    value?: unknown;
  };
  promise.status = "fulfilled";
  promise.value = result;
  return promise;
}
