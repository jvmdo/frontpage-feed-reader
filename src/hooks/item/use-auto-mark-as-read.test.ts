import { renderHook } from "@testing-library/react";
import { usePreferencesStore } from "@/hooks/ui/use-preferences-store";
import { createMockItemWithSource } from "@/tests/factories";
import { useAutoMarkAsRead } from "./use-auto-mark-as-read";

describe("useAutoMarkAsRead", () => {
  const mockSetReadStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks an unread item as read when loaded immediately", () => {
    usePreferencesStore.getState().setAutoMarkRead("immediately", 5);
    const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

    renderHook(() =>
      useAutoMarkAsRead({
        activeItemId: 1,
        data,
        setReadStatus: mockSetReadStatus,
      }),
    );

    expect(mockSetReadStatus).toHaveBeenCalledWith({ itemId: 1, isRead: true });
  });

  it("does not mark an already read item as read when loaded", () => {
    usePreferencesStore.getState().setAutoMarkRead("immediately", 5);
    const data = createMockItemWithSource({ item: { id: 1 }, isRead: true });

    renderHook(() =>
      useAutoMarkAsRead({
        activeItemId: 1,
        data,
        setReadStatus: mockSetReadStatus,
      }),
    );

    expect(mockSetReadStatus).not.toHaveBeenCalled();
  });

  it("does not mark item as read automatically in manual mode", () => {
    usePreferencesStore.getState().setAutoMarkRead("manual", 5);
    const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

    renderHook(() =>
      useAutoMarkAsRead({
        activeItemId: 1,
        data,
        setReadStatus: mockSetReadStatus,
      }),
    );

    expect(mockSetReadStatus).not.toHaveBeenCalled();
  });

  describe("automatic read state with timer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not call setReadStatus before delay completes", () => {
      usePreferencesStore.getState().setAutoMarkRead("delayed", 5);
      const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

      renderHook(() =>
        useAutoMarkAsRead({
          activeItemId: 1,
          data,
          setReadStatus: mockSetReadStatus,
        }),
      );

      vi.advanceTimersByTime(4999);
      expect(mockSetReadStatus).not.toHaveBeenCalled();
    });

    it("calls setReadStatus after delay completes", () => {
      usePreferencesStore.getState().setAutoMarkRead("delayed", 5);
      const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

      renderHook(() =>
        useAutoMarkAsRead({
          activeItemId: 1,
          data,
          setReadStatus: mockSetReadStatus,
        }),
      );

      vi.advanceTimersByTime(5000);
      expect(mockSetReadStatus).toHaveBeenCalledWith({
        itemId: 1,
        isRead: true,
      });
    });

    it("cancels timer if unmounts before delay completes", () => {
      usePreferencesStore.getState().setAutoMarkRead("delayed", 5);
      const data = createMockItemWithSource({ item: { id: 1 }, isRead: false });

      const { unmount } = renderHook(() =>
        useAutoMarkAsRead({
          activeItemId: 1,
          data,
          setReadStatus: mockSetReadStatus,
        }),
      );

      vi.advanceTimersByTime(2000);
      unmount();

      vi.advanceTimersByTime(3000);
      expect(mockSetReadStatus).not.toHaveBeenCalled();
    });
  });
});
