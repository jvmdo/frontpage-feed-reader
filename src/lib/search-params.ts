import { parseAsArrayOf, parseAsBoolean, parseAsInteger } from "nuqs";

/**
 * Shared parsers for feed filtering to ensure consistency between
 * hooks, components, and URL generation.
 */
export const feedFilterParsers = {
  feedId: parseAsInteger.withDefault(0),
  categoryId: parseAsInteger.withDefault(0),
  saved: parseAsBoolean.withDefault(false),
  unreadOnly: parseAsBoolean.withDefault(false),
  feedIds: parseAsArrayOf(parseAsInteger).withDefault([]),
};

/**
 * Navigation state factory.
 * Provides clean methods to generate mutually exclusive dashboard states.
 */
export const dashboardState = {
  allItems: () => ({
    feedId: null,
    categoryId: null,
    saved: false,
    feedIds: null,
    unreadOnly: null,
  }),
  saved: () => ({
    saved: true,
    feedId: null,
    categoryId: null,
    feedIds: null,
    unreadOnly: null,
  }),
  feed: (id: number) => ({
    feedId: id,
    categoryId: null,
    saved: false,
    feedIds: null,
    unreadOnly: null,
  }),
  category: (id: number) => ({
    categoryId: id,
    feedId: null,
    saved: false,
    feedIds: null,
    unreadOnly: null,
  }),
};
