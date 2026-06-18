import { act, renderHook } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeedFilter } from "@/hooks/feed/use-feed-filter";
import { FeedLayout, useViewOptions } from "./use-view-options";

vi.mock("@/hooks/feed/use-feed-filter", () => ({
  useFeedFilter: vi.fn(),
}));

describe("useViewOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, "", "/");
    vi.mocked(useFeedFilter).mockReturnValue({ isSaved: false } as any);
  });

  it("should respect explicit layout parameters in the URL", () => {
    window.history.pushState({}, "", "/?layout=grid");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter searchParams={{ layout: "grid" }}>
        {children}
      </NuqsTestingAdapter>
    );

    const { result } = renderHook(() => useViewOptions(), { wrapper });

    expect(result.current.layout).toBe(FeedLayout.Grid);
  });

  it("should sync layout from localStorage on mount if URL param is absent", () => {
    localStorage.setItem("frontpage_feed_layout", FeedLayout.Rows);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    );

    const { result } = renderHook(() => useViewOptions(), { wrapper });

    expect(result.current.layout).toBe(FeedLayout.Rows);
  });

  it("should ignore localStorage values if explicit URL parameter is present", () => {
    localStorage.setItem("frontpage_feed_layout", FeedLayout.Rows);
    window.history.pushState({}, "", "/?layout=grid");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter searchParams={{ layout: "grid" }}>
        {children}
      </NuqsTestingAdapter>
    );

    const { result } = renderHook(() => useViewOptions(), { wrapper });

    // URL layout "grid" wins over localStorage layout "rows"
    expect(result.current.layout).toBe(FeedLayout.Grid);
  });

  it("should persist layout to localStorage when setLayout is called", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    );

    const { result } = renderHook(() => useViewOptions(), { wrapper });

    act(() => {
      result.current.setLayout(FeedLayout.Grid);
    });

    expect(result.current.layout).toBe(FeedLayout.Grid);
    expect(localStorage.getItem("frontpage_feed_layout")).toBe(FeedLayout.Grid);
  });
});
