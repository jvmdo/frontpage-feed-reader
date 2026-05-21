import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { DB } from "@/db";
import {
  categories,
  feedItems,
  feeds,
  subscriptions,
  userItemStates,
  userPreferences,
} from "@/db/schema";
import { isExcerpt } from "@/lib/feed/utils";
import type { ListItemWithSource } from "@/types";

interface GetItemsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  feedId?: number | null;
  categoryId?: number | null;
  feedIds?: number[] | null;
  bookmarkedOnly?: boolean;
  unreadOnly?: boolean;
  sortBy?: "publishedAt" | "bookmarkedAt";
  sortOrder?: "desc" | "asc";
}

/**
 * The searchable "Document" definition (Single Source of Truth for tsvector).
 */
const searchDoc = sql`(
  setweight(to_tsvector('english', coalesce(${feedItems.title}, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(${feedItems.description}, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(${feedItems.textContent}, '')), 'C')
)`;

/**
 * Builds PostgreSQL Full-Text Search fragments (filter, rank, snippet).
 */
function buildSearchFragments(search?: string) {
  if (!search) {
    return {
      searchFilter: undefined,
      rank: undefined,
      snippet: sql<string | null>`NULL`,
    };
  }

  const query = sql`websearch_to_tsquery('english', ${search})`;

  return {
    searchFilter: sql`${searchDoc} @@ ${query}`,
    rank: sql`ts_rank(${searchDoc}, ${query})`,
    snippet: sql<string>`ts_headline('english', 
        coalesce(${feedItems.textContent}, ${feedItems.description}, ${feedItems.title}, ''), 
        ${query},
        'StartSel=<b>, StopSel=</b>, MaxWords=35, MinWords=15, ShortWord=3, MaxFragments=2, FragmentDelimiter="..."'
      )`,
  };
}

/**
 * Builds the ORDER BY clauses based on search relevance and user preferences.
 */
function buildSortClauses(
  options: Pick<GetItemsOptions, "search" | "sortBy" | "sortOrder"> & {
    rank?: SQL;
  },
) {
  const { search, sortBy = "publishedAt", sortOrder = "desc", rank } = options;
  const direction = sortOrder === "asc" ? asc : desc;
  const clauses = [];

  // When searching, always prioritize relevance (rank)
  if (search && rank) {
    clauses.push(desc(rank));
  }

  clauses.push(
    sortBy === "bookmarkedAt"
      ? direction(userItemStates.bookmarkedAt)
      : direction(feedItems.publishedAt),
    direction(feedItems.createdAt),
  );

  return clauses;
}

/**
 * Retrieves a paginated list of feed items for a specific user.
 * Supports weighted Full-Text Search (title, description, content),
 * dynamic snippets, and user-specific read/bookmark states.
 */
export async function getItems(
  db: DB,
  userId: string,
  options: GetItemsOptions,
): Promise<ListItemWithSource[]> {
  const {
    limit = 20,
    offset = 0,
    search,
    feedId,
    categoryId,
    feedIds,
    bookmarkedOnly,
    unreadOnly,
    sortBy = "publishedAt",
    sortOrder = "desc",
  } = options;

  const { searchFilter, rank, snippet } = buildSearchFragments(search);
  const sortClauses = buildSortClauses({ search, sortBy, sortOrder, rank });

  const {
    rawPayload: _rawPayload,
    content: _content,
    ...itemColumns
  } = getTableColumns(feedItems);

  const results = await db
    .select({
      item: itemColumns,
      feed: feeds,
      readAt: userItemStates.readAt,
      bookmarkedAt: userItemStates.bookmarkedAt,
      globalWatermark: userPreferences.markedAllReadAt,
      categoryWatermark: categories.markedAllReadAt,
      subscriptionWatermark: subscriptions.markedAllReadAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      snippet,
    })
    .from(feedItems)
    .innerJoin(feeds, eq(feedItems.feedId, feeds.id))
    .innerJoin(subscriptions, eq(feeds.id, subscriptions.feedId))
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .leftJoin(userPreferences, eq(subscriptions.userId, userPreferences.userId))
    .leftJoin(
      userItemStates,
      and(
        eq(feedItems.id, userItemStates.itemId),
        eq(userItemStates.userId, userId),
      ),
    )
    .where(
      and(
        eq(subscriptions.userId, userId),
        searchFilter,
        feedId ? eq(feedItems.feedId, feedId) : undefined,
        categoryId ? eq(subscriptions.categoryId, categoryId) : undefined,
        feedIds && feedIds.length > 0
          ? inArray(feedItems.feedId, feedIds)
          : undefined,
        bookmarkedOnly ? isNotNull(userItemStates.bookmarkedAt) : undefined,
        unreadOnly
          ? and(
              isNull(userItemStates.readAt),
              or(
                isNull(userPreferences.markedAllReadAt),
                gt(feedItems.createdAt, userPreferences.markedAllReadAt),
              ),
              or(
                isNull(categories.markedAllReadAt),
                gt(feedItems.createdAt, categories.markedAllReadAt),
              ),
              or(
                isNull(subscriptions.markedAllReadAt),
                gt(feedItems.createdAt, subscriptions.markedAllReadAt),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(...sortClauses)
    .limit(limit)
    .offset(offset);

  return results.map((row) => {
    const itemTimestamp = row.item.createdAt;

    // Cascading watermark logic
    const watermarks = [
      row.globalWatermark,
      row.categoryWatermark,
      row.subscriptionWatermark,
    ].filter((w): w is Date => w !== null);

    const latestWatermark =
      watermarks.length > 0
        ? new Date(Math.max(...watermarks.map((w) => w.getTime())))
        : null;

    const isRead =
      !!row.readAt || (!!latestWatermark && itemTimestamp <= latestWatermark);

    return {
      item: row.item,
      feed: row.feed,
      isRead,
      isBookmarked: !!row.bookmarkedAt,
      bookmarkedAt: row.bookmarkedAt,
      isExcerpt: isExcerpt(row.item),
      categoryName: row.categoryName,
      categoryColor: row.categoryColor,
      searchSnippet: row.snippet,
    };
  });
}
