/** biome-ignore-all lint/suspicious/noExplicitAny: test test */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useMarkAllRead } from "@/hooks/feed/use-mark-all-read";
import { useUnreadCounts } from "@/hooks/feed/use-unread-counts";
import { useMarkAllReadUI } from "./use-mark-all-read-ui";

vi.mock("@/hooks/feed/use-feed-filter");
vi.mock("@/hooks/feed/use-mark-all-read");
vi.mock("@/hooks/feed/use-unread-counts");

describe("useMarkAllReadUI", () => {
  const mockMutate = vi.fn();
  const mockFilter = {
    feedId: null,
    categoryId: null,
    setFeedId: vi.fn(),
    setCategoryId: vi.fn(),
    clearFilter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useFeedFilter).mockReturnValue(mockFilter);
    vi.mocked(useMarkAllRead).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
    vi.mocked(useUnreadCounts).mockReturnValue({
      data: { global: 10, categories: { "1": 5 }, feeds: { "123": 3 } },
    } as any);
  });

  it("returns global state when no filters are active", () => {
    const { result } = renderHook(() => useMarkAllReadUI());

    expect(result.current.currentCount).toBe(10);
    expect(result.current.scopeLabel).toBe("all your feeds");
    expect(result.current.isDisabled).toBe(false);
  });

  it("returns category state when categoryId is active", () => {
    vi.mocked(useFeedFilter).mockReturnValue({ ...mockFilter, categoryId: 1 });

    const { result } = renderHook(() => useMarkAllReadUI());

    expect(result.current.currentCount).toBe(5);
    expect(result.current.scopeLabel).toBe("this category");
  });

  it("returns feed state when feedId is active", () => {
    vi.mocked(useFeedFilter).mockReturnValue({ ...mockFilter, feedId: 123 });

    const { result } = renderHook(() => useMarkAllReadUI());

    expect(result.current.currentCount).toBe(3);
    expect(result.current.scopeLabel).toBe("this feed");
  });

  it("disables when count is 0", () => {
    vi.mocked(useUnreadCounts).mockReturnValue({
      data: { global: 0, categories: {}, feeds: {} },
    } as any);

    const { result } = renderHook(() => useMarkAllReadUI());

    expect(result.current.isDisabled).toBe(true);
  });

  it("disables when mutation is pending", () => {
    vi.mocked(useMarkAllRead).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as any);

    const { result } = renderHook(() => useMarkAllReadUI());

    expect(result.current.isDisabled).toBe(true);
  });

  it("calls markAllRead with global scope", () => {
    const { result } = renderHook(() => useMarkAllReadUI());

    result.current.handleMarkAllRead();

    expect(mockMutate).toHaveBeenCalledWith({ scope: "global" });
  });

  it("calls markAllRead with category scope", () => {
    vi.mocked(useFeedFilter).mockReturnValue({ ...mockFilter, categoryId: 1 });
    const { result } = renderHook(() => useMarkAllReadUI());

    result.current.handleMarkAllRead();

    expect(mockMutate).toHaveBeenCalledWith({ scope: "category", id: 1 });
  });

  it("calls markAllRead with feed scope", () => {
    vi.mocked(useFeedFilter).mockReturnValue({ ...mockFilter, feedId: 123 });
    const { result } = renderHook(() => useMarkAllReadUI());

    result.current.handleMarkAllRead();

    expect(mockMutate).toHaveBeenCalledWith({ scope: "feed", id: 123 });
  });
});
