import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoMarkAsRead } from "@/hooks/item/use-auto-mark-as-read";
import { usePreferencesStore } from "@/hooks/ui/use-preferences-store";

describe("useAutoMarkAsRead", () => {
  const mockSetReadStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    usePreferencesStore.setState({
      autoMarkReadMode: "delayed",
      autoMarkReadDelay: 5,
    });
  });

  const setup = (initialProps: any) => {
    return renderHook(
      (props) =>
        useAutoMarkAsRead({
          setReadStatus: mockSetReadStatus,
          ...props,
        }),
      {
        initialProps,
      },
    );
  };

  it("marks unread item as read after the delay", () => {
    setup({
      activeItemId: 1,
      data: { isRead: false },
    });

    expect(mockSetReadStatus).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockSetReadStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReadStatus).toHaveBeenCalledWith({
      itemId: 1,
      isRead: true,
    });
  });

  it("cancels the timer if activeItemId changes before the delay finishes", () => {
    const { rerender } = setup({
      activeItemId: 1,
      data: { isRead: false },
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Navigate to a new item
    rerender({
      activeItemId: 2,
      data: { isRead: true },
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Timer was cancelled, so no mutation happens for item 1
    expect(mockSetReadStatus).not.toHaveBeenCalled();
  });

  it("does not cancel the timer if data reference changes", () => {
    const { rerender } = setup({
      activeItemId: 1,
      data: { isRead: false, someOtherProp: "A" },
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Data reference changes (e.g., background fetch finishes)
    rerender({
      activeItemId: 1,
      data: { isRead: false, someOtherProp: "B" },
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Timer should still fire
    expect(mockSetReadStatus).toHaveBeenCalledTimes(1);
    expect(mockSetReadStatus).toHaveBeenCalledWith({
      itemId: 1,
      isRead: true,
    });
  });

  it("triggers auto-mark on return visits to the same item", () => {
    const { rerender } = setup({
      activeItemId: 1,
      data: { isRead: false },
    });

    // First visit to Item 1
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockSetReadStatus).toHaveBeenCalledTimes(1);

    // Simulate user manually marking it as unread while still open
    rerender({
      activeItemId: 1,
      data: { isRead: false },
    });

    // Navigate to Item 2 (already read)
    rerender({
      activeItemId: 2,
      data: { isRead: true },
    });

    // Navigate back to Item 1
    rerender({
      activeItemId: 1,
      data: { isRead: false },
    });

    // The delay timer should have started again
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should have triggered a second time
    expect(mockSetReadStatus).toHaveBeenCalledTimes(2);
  });

  it("marks immediately if preferences say so", () => {
    usePreferencesStore.setState({ autoMarkReadMode: "immediately" });

    setup({
      activeItemId: 1,
      data: { isRead: false },
    });

    // Should be called right away
    expect(mockSetReadStatus).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Still only called once
    expect(mockSetReadStatus).toHaveBeenCalledTimes(1);
  });
});
