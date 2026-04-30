import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItems } from "@/hooks/item/use-items";
import { useMarkRead } from "@/hooks/item/use-mark-read";

/**
 * Hook to handle navigation between feed items in the Reader View.
 * It finds neighbors in the current dashboard list and handles
 * state updates and unread tracking.
 */
export function useItemReaderNavigation() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useItems();
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { mutate: markAsRead } = useMarkRead();

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
