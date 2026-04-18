/**
 * Simple in-memory store to track scroll positions for feeds during the session.
 */

const scrollPositions = new Map<string, number>();

export function saveFeedScroll(feedId: number | null) {
  if (typeof window === "undefined") return;
  scrollPositions.set(String(feedId ?? "all"), window.scrollY);
}

export function getFeedScroll(feedId: number | null) {
  if (typeof window === "undefined") return 0;
  return scrollPositions.get(String(feedId ?? "all")) ?? 0;
}
