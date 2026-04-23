import { useActiveItem } from "./use-active-item";
import { useFeedItems } from "./use-feed-items";
import { useMarkAsRead } from "./use-mark-as-read";

/**
 * Hook to handle navigation between feed items in the Reader View.
 * It finds neighbors in the current dashboard list and handles
 * state updates and unread tracking.
 */
export function useFeedNavigation() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeedItems();
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { mutate: markAsRead } = useMarkAsRead();

  const items = data.pages.flat();
  const currentIndex = items.findIndex((i) => i.item.id === activeItemId);

  const nextItem = currentIndex !== -1 ? items[currentIndex + 1] : null;
  const prevItem = currentIndex !== -1 ? items[currentIndex - 1] : null;

  const navigateTo = (itemId: number) => {
    const item = items.find((i) => i.item.id === itemId);
    if (item && !item.isRead) {
      markAsRead({ itemId: item.item.id });
    }
    setActiveItemId(itemId);
  };

  const goToNext = () => {
    if (nextItem) {
      // Trigger fetch if we are close to the end
      if (
        currentIndex >= items.length - 3 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
      navigateTo(nextItem.item.id);
    }
  };

  const goToPrev = () => {
    if (prevItem) {
      navigateTo(prevItem.item.id);
    }
  };

  return {
    nextItemId: nextItem?.item.id ?? null,
    prevItemId: prevItem?.item.id ?? null,
    goToNext,
    goToPrev,
    hasNext: !!nextItem,
    hasPrev: !!prevItem,
  };
}
