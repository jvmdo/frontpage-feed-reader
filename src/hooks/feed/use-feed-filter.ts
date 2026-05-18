"use client";

import { useQueryStates } from "nuqs";
import { feedFilterParsers } from "@/lib/search-params";

/**
 * Hook to manage feedId, categoryId, saved, and refinement filters in the URL.
 * At the top level: feedId, categoryId, and saved are mutually exclusive.
 * Within 'saved', feedIds and unreadOnly provide additional refinement.
 */
export function useFeedFilter() {
  const [states, setStates] = useQueryStates(feedFilterParsers);

  const feedId = states.feedId === 0 ? null : states.feedId;
  const categoryId = states.categoryId === 0 ? null : states.categoryId;
  const isSaved = states.saved;
  const unreadOnly = states.unreadOnly;
  const feedIds = states.feedIds;

  const setFeedId = (id: number | null) =>
    setStates({
      feedId: id ?? 0,
      categoryId: 0,
      saved: false,
      feedIds: [],
      unreadOnly: false,
    });

  const setCategoryId = (id: number | null) =>
    setStates({
      categoryId: id ?? 0,
      feedId: 0,
      saved: false,
      feedIds: [],
      unreadOnly: false,
    });

  const goToSaved = () =>
    setStates({
      saved: true,
      feedId: 0,
      categoryId: 0,
      feedIds: [],
      unreadOnly: false,
    });

  const setFeedIds = (ids: number[]) => setStates({ feedIds: ids });
  const setUnreadOnly = (unread: boolean) => setStates({ unreadOnly: unread });

  const clearFilter = () =>
    setStates({
      feedId: 0,
      categoryId: 0,
      feedIds: [],
      unreadOnly: false,
    });

  return {
    feedId,
    setFeedId,
    categoryId,
    setCategoryId,
    isSaved,
    goToSaved,
    unreadOnly,
    setUnreadOnly,
    feedIds,
    setFeedIds,
    clearFilter,
    setStates,
  };
}
