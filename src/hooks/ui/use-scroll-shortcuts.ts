import { useEffect } from "react";
import { isEditableTarget } from "@/lib/utils";

interface UseScrollShortcutsOptions {
  selector: string;
  enabled?: boolean;
}

/**
 * Custom hook to enable PageUp/PageDown/Home/End keyboard scrolling for a selector when enabled.
 */
export const useScrollShortcuts = ({
  selector,
  enabled = true,
}: UseScrollShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't scroll if user is typing in input elements
      if (isEditableTarget(e.target)) return;

      // 1. Only intercept if it's one of our handled scrolling keys
      const targetKeys = ["PageDown", "PageUp", "Home", "End"];
      if (!targetKeys.includes(e.key)) return;

      const viewport = document.querySelector(selector) as HTMLElement | null;
      if (!viewport) return;

      e.preventDefault();

      const scrollAmount = viewport.clientHeight * 0.85; // Scroll ~85% of screen height

      if (e.key === "PageDown") {
        viewport.scrollBy({ top: scrollAmount });
      } else if (e.key === "PageUp") {
        viewport.scrollBy({ top: -scrollAmount });
      } else if (e.key === "Home") {
        viewport.scrollTo({ top: 0 });
      } else if (e.key === "End") {
        viewport.scrollTo({ top: viewport.scrollHeight });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selector, enabled]);
};
