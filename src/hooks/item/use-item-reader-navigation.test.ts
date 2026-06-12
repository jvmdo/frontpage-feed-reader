/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { describe, expect, it, vi } from "vitest";
import { useActiveItem } from "@/hooks/item/use-active-item";
import { useItemReaderNavigation } from "@/hooks/item/use-item-reader-navigation";
import { useItems } from "@/hooks/item/use-items";
import { createMockItemWithSource } from "@/tests/factories";
import { renderHook } from "@/tests/rtl-utils";

vi.mock("@/hooks/item/use-items");
vi.mock("@/hooks/item/use-active-item");

describe("useFeedNavigation", () => {
  const mockItems = [
    createMockItemWithSource({ item: { id: 1 }, isRead: true }),
    createMockItemWithSource({ item: { id: 2 }, isRead: false }),
    createMockItemWithSource({ item: { id: 3 }, isRead: false }),
  ];

  it("should identify neighbors correctly", () => {
    vi.mocked(useItems).mockReturnValue({
      data: mockItems,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 2,
      setActiveItemId: vi.fn(),
    } as any);

    const { result } = renderHook(() => useItemReaderNavigation());

    expect(result.current.nextItemId).toBe(3);
    expect(result.current.prevItemId).toBe(1);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(true);
  });

  it("should return null for neighbors at boundaries", () => {
    vi.mocked(useItems).mockReturnValue({
      data: mockItems,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
    } as any);

    const { result } = renderHook(() => useItemReaderNavigation());

    expect(result.current.prevItemId).toBe(null);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.nextItemId).toBe(2);
  });

  it("should navigate to next", () => {
    const setActiveItemId = vi.fn();

    vi.mocked(useItems).mockReturnValue({
      data: mockItems,
      hasNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 1,
      setActiveItemId,
    } as any);

    const { result } = renderHook(() => useItemReaderNavigation());

    result.current.goToNext();

    expect(setActiveItemId).toHaveBeenCalledWith(2);
  });

  it("should navigate to prev", () => {
    const setActiveItemId = vi.fn();

    vi.mocked(useItems).mockReturnValue({
      data: mockItems,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 2,
      setActiveItemId,
    } as any);

    const { result } = renderHook(() => useItemReaderNavigation());

    result.current.goToPrev();

    expect(setActiveItemId).toHaveBeenCalledWith(1);
  });

  it("should trigger fetchNextPage when navigating near the end of the list", () => {
    const fetchNextPage = vi.fn();
    const manyItems = Array.from({ length: 10 }, (_, i) =>
      createMockItemWithSource({ item: { id: i + 1 } }),
    );

    vi.mocked(useItems).mockReturnValue({
      data: manyItems,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    vi.mocked(useActiveItem).mockReturnValue({
      activeItemId: 8, // Near the end (10 total, 0-indexed 7)
      setActiveItemId: vi.fn(),
    } as any);

    const { result } = renderHook(() => useItemReaderNavigation());

    result.current.goToNext();

    expect(fetchNextPage).toHaveBeenCalled();
  });
});
