/**
 * Simple in-memory store to track scroll positions for items and reader views during the session.
 */

const scrollPositions = new Map<string, number>();

export function saveItemsListScroll(filterId: number | null) {
  if (typeof window === "undefined") return;
  const container = document.getElementById("feed-container");
  const scrollTop = container ? container.scrollTop : window.scrollY;
  scrollPositions.set(`items-list-${filterId ?? "all"}`, scrollTop);
}

export function getItemsListScroll(filterId: number | null) {
  if (typeof window === "undefined") return 0;
  return scrollPositions.get(`items-list-${filterId ?? "all"}`) ?? 0;
}

export function saveItemReaderScroll(itemId: number, scrollTop: number) {
  scrollPositions.set(`item-reader-${itemId}`, scrollTop);
}

export function getItemReaderScroll(itemId: number) {
  return scrollPositions.get(`item-reader-${itemId}`) ?? 0;
}
