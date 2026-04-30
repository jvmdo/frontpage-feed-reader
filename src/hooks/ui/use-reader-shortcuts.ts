"use client";

import { type RefObject, useEffect } from "react";

interface UseReaderShortcutsOptions {
  onNext: () => void;
  onPrev: () => void;
  enabled: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Hook to handle keyboard shortcuts in the Reader View.
 * Supports Navigation (j/k, Arrows) and manual Scroll hijacking
 * to allow scrolling even when the container isn't focused.
 */
export function useReaderShortcuts({
  onNext,
  onPrev,
  enabled,
  scrollContainerRef,
}: UseReaderShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const container = scrollContainerRef.current;

      // 1. Navigation Shortcuts
      if (key === "arrowright" || key === "j") {
        event.preventDefault();
        onNext();
        return;
      }

      if (key === "arrowleft" || key === "k") {
        event.preventDefault();
        onPrev();
        return;
      }

      // 2. Scroll Shortcuts (Manual hijacking since container might not be focused)
      if (!container) return;

      const scrollAmount = container.clientHeight * 0.8;

      switch (key) {
        case "arrowdown":
          event.preventDefault();
          container.scrollBy({ top: 100, behavior: "auto" });
          break;
        case "arrowup":
          event.preventDefault();
          container.scrollBy({ top: -100, behavior: "auto" });
          break;
        case "pagedown":
          event.preventDefault();
          container.scrollBy({ top: scrollAmount, behavior: "smooth" });
          break;
        case "pageup":
          event.preventDefault();
          container.scrollBy({ top: -scrollAmount, behavior: "smooth" });
          break;
        case "home":
          event.preventDefault();
          container.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "end":
          event.preventDefault();
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, enabled, scrollContainerRef]);
}
