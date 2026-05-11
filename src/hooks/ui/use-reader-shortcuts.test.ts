import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useReaderShortcuts } from "@/hooks/ui/use-reader-shortcuts";

describe("useReaderShortcuts", () => {
  it("should call onNext when ArrowRight or j is pressed", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    renderHook(() => useReaderShortcuts({ onNext, onPrev, enabled: true }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(onNext).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(onNext).toHaveBeenCalledTimes(2);

    expect(onPrev).not.toHaveBeenCalled();
  });

  it("should call onPrev when ArrowLeft or k is pressed", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    renderHook(() => useReaderShortcuts({ onNext, onPrev, enabled: true }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(onPrev).toHaveBeenCalledTimes(2);

    expect(onNext).not.toHaveBeenCalled();
  });

  it("should not call callbacks when disabled", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    renderHook(() =>
      useReaderShortcuts({
        onNext,
        onPrev,
        enabled: false,
      }),
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

    expect(onNext).not.toHaveBeenCalled();
  });
});
