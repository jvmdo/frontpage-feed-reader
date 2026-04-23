/**
 * Simple in-memory store to track scroll positions for feeds and articles during the session.
 */

const scrollPositions = new Map<string, number>();

export function saveFeedScroll(feedId: number | null) {
  if (typeof window === "undefined") return;
  scrollPositions.set(`feed-${feedId ?? "all"}`, window.scrollY);
}

export function getFeedScroll(feedId: number | null) {
  if (typeof window === "undefined") return 0;
  return scrollPositions.get(`feed-${feedId ?? "all"}`) ?? 0;
}

export function saveArticleScroll(articleId: number, scrollTop: number) {
  scrollPositions.set(`article-${articleId}`, scrollTop);
}

export function getArticleScroll(articleId: number) {
  return scrollPositions.get(`article-${articleId}`) ?? 0;
}
