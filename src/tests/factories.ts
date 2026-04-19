import type {
  Category,
  Feed,
  FeedItem,
  FeedItemWithSource,
  FeedWithSubscription,
  Subscription,
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
    httpEtag: null,
    httpLastModified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCategory(overrides: Partial<Category> = {}): Category {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    userId: "user-1",
    name: `Category ${id}`,
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
  overrides: Partial<{ feed: Partial<Feed>; subscription: Partial<Subscription> }> = {},
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

export function createMockFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  const id = overrides.id ?? Math.floor(Math.random() * 1000);
  return {
    id,
    feedId: Math.floor(Math.random() * 1000),
    guid: `guid-${id}`,
    url: `https://example.com/item-${id}`,
    title: `Mock Item ${id}`,
    description: "A description for the mock item",
    content: "Full content for the mock item",
    author: "Author Name",
    publishedAt: new Date(),
    updatedAt: new Date(),
    rawPayload: {},
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockFeedItemWithSource(
  overrides: Partial<{ item: Partial<FeedItem>; feed: Partial<Feed> }> = {},
): FeedItemWithSource {
  const feed = createMockFeed(overrides.feed);
  const item = createMockFeedItem({
    feedId: feed.id,
    ...overrides.item,
  });

  return {
    item,
    feed,
  };
}
