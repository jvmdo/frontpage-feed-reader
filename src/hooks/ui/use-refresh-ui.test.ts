/** biome-ignore-all lint/suspicious/noExplicitAny: test asset */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { useRefreshFeed } from "@/hooks/feed/use-refresh-feed";
import { useRefreshUI } from "./use-refresh-ui";

vi.mock("@/hooks/feed/use-feed-filter");
vi.mock("@/hooks/feed/use-refresh-feed");

describe("useRefreshUI", () => {
  const mockMutate = vi.fn();
  const mockFilter = {
    feedId: null,
    categoryId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFeedFilter).mockReturnValue(mockFilter as any);
    vi.mocked(useRefreshFeed).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it("calls refreshFeed with global scope when no filter", () => {
    const { result } = renderHook(() => useRefreshUI());

    result.current.handleRefresh();

    expect(mockMutate).toHaveBeenCalledWith(
      { scope: "global", id: undefined },
      expect.anything(),
    );
  });

  it("calls refreshFeed with category scope when categoryId active", () => {
    vi.mocked(useFeedFilter).mockReturnValue({
      ...mockFilter,
      categoryId: 1,
    } as any);

    const { result } = renderHook(() => useRefreshUI());

    result.current.handleRefresh();

    expect(mockMutate).toHaveBeenCalledWith(
      { scope: "category", id: 1 },
      expect.anything(),
    );
  });

  it("calls refreshFeed with feed scope when feedId active", () => {
    vi.mocked(useFeedFilter).mockReturnValue({
      ...mockFilter,
      feedId: 123,
    } as any);

    const { result } = renderHook(() => useRefreshUI());

    result.current.handleRefresh();

    expect(mockMutate).toHaveBeenCalledWith(
      { scope: "feed", id: 123 },
      expect.anything(),
    );
  });
});
