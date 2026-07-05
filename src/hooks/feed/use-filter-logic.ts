import { useCategories } from "@/hooks/category/use-categories";
import { useFeeds } from "@/hooks/feed/use-feeds";

interface UseFilterLogicProps {
  feedIds: number[];
  setFeedIds: (ids: number[]) => void;
}

export function useFilterLogic({ feedIds, setFeedIds }: UseFilterLogicProps) {
  const { data: categories } = useCategories();
  const { data: feeds } = useFeeds();

  const toggleFeed = (id: number) => {
    if (feedIds.includes(id)) {
      setFeedIds(feedIds.filter((fid) => fid !== id));
    } else {
      setFeedIds([...feedIds, id]);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const categoryFeeds = feeds
      .filter((f) => f.subscription.categoryId === categoryId)
      .map((f) => f.feed.id);

    const allSelected = categoryFeeds.every((id) => feedIds.includes(id));

    if (allSelected) {
      setFeedIds(feedIds.filter((id) => !categoryFeeds.includes(id)));
    } else {
      setFeedIds([...new Set([...feedIds, ...categoryFeeds])]);
    }
  };

  const isCategorySelected = (categoryId: number) => {
    const categoryFeeds = feeds
      .filter((f) => f.subscription.categoryId === categoryId)
      .map((f) => f.feed.id);

    if (categoryFeeds.length === 0) return false;
    return categoryFeeds.every((id) => feedIds.includes(id));
  };

  const categoriesWithFeeds = categories.filter(({ id }) =>
    feeds.some((f) => f.subscription.categoryId === id),
  );

  return {
    feeds,
    categoriesWithFeeds,
    toggleFeed,
    toggleCategory,
    isCategorySelected,
  };
}
