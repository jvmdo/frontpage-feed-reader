/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { describe, expect, it, vi } from "vitest";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { renderHook } from "@/tests/rtl-utils";
import { useActiveItem } from "./use-active-item";
import { useFeedItems } from "./use-feed-items";
import { useFeedNavigation } from "./use-feed-navigation";
import { useMarkAsRead } from "./use-mark-as-read";

vi.mock("./use-feed-items");
vi.mock("./use-active-item");
vi.mock("./use-mark-as-read");

describe("useFeedNavigation", () => {
  const mockItems = [
    createMockFeedItemWithSource({ item: { id: 1 }, isRead: true }),
    createMockFeedItemWithSource({ item: { id: 2 }, isRead: false }),
    createMockFeedItemWithSource({ item: { id: 3 }, isRead: false }),
  ];

  it("should identify neighbors correctly", () => {
    vi.mocked(useFeedItems).mockReturnValue({
      data: { pages: [mockItems] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 2,
      setActiveItemId: vi.fn(),
    } as any);

    vi.mocked(useMarkAsRead).mockReturnValue({ mutate: vi.fn() } as any);

    const { result } = renderHook(() => useFeedNavigation());

    expect(result.current.nextItemId).toBe(3);
    expect(result.current.prevItemId).toBe(1);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(true);
  });

  it("should return null for neighbors at boundaries", () => {
    vi.mocked(useFeedItems).mockReturnValue({
      data: { pages: [mockItems] },
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
    } as any);

    const { result } = renderHook(() => useFeedNavigation());

    expect(result.current.prevItemId).toBe(null);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.nextItemId).toBe(2);
  });

  it("should navigate to next and mark as read if unread", () => {
    const setActiveItemId = vi.fn();
    const markAsRead = vi.fn();

    vi.mocked(useFeedItems).mockReturnValue({
      data: { pages: [mockItems] },
      hasNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId,
    } as any);

    vi.mocked(useMarkAsRead).mockReturnValue({ mutate: markAsRead } as any);

    const { result } = renderHook(() => useFeedNavigation());

    result.current.goToNext();

    expect(setActiveItemId).toHaveBeenCalledWith(2);
    expect(markAsRead).toHaveBeenCalledWith({ itemId: 2 });
  });

  it("should not mark as read if item is already read", () => {
    const setActiveItemId = vi.fn();
    const markAsRead = vi.fn();

    vi.mocked(useFeedItems).mockReturnValue({
      data: { pages: [mockItems] },
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 2,
      setActiveItemId,
    } as any);

    vi.mocked(useMarkAsRead).mockReturnValue({ mutate: markAsRead } as any);

    const { result } = renderHook(() => useFeedNavigation());

    result.current.goToPrev();

    expect(setActiveItemId).toHaveBeenCalledWith(1);
    expect(markAsRead).not.toHaveBeenCalled();
  });

  it("should trigger fetchNextPage when navigating near the end of the list", () => {
    const fetchNextPage = vi.fn();
    const manyItems = Array.from({ length: 10 }, (_, i) =>
      createMockFeedItemWithSource({ item: { id: i + 1 } }),
    );

    vi.mocked(useFeedItems).mockReturnValue({
      data: { pages: [manyItems] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 8, // Near the end (10 total, 0-indexed 7)
      setActiveItemId: vi.fn(),
    } as any);

    const { result } = renderHook(() => useFeedNavigation());

    result.current.goToNext();

    expect(fetchNextPage).toHaveBeenCalled();
  });
});
