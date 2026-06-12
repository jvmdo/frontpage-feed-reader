import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItems } from "@/hooks/item/use-items";

/**
 * Hook to handle navigation between feed items in the Reader View.
 * It finds neighbors in the current dashboard list and handles
 * state updates and unread tracking.
 */
export function useItemReaderNavigation() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useItems();
  const { activeItemId, setActiveItemId } = useActiveItem();

  const currentIndex = data.findIndex((i) => i.item.id === activeItemId);
  const nextItem = currentIndex !== -1 ? data[currentIndex + 1] : null;
  const prevItem = currentIndex !== -1 ? data[currentIndex - 1] : null;

  const navigateTo = (itemId: number) => {
    setActiveItemId(itemId);
  };

  const goToNext = () => {
    if (nextItem) {
      // Trigger fetch if we are close to the end
      if (
        currentIndex >= data.length - 3 &&
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
