import { useHotkeys } from "react-hotkeys-hook";

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
  useHotkeys(
    ["pageup", "pagedown", "home", "end"],
    (e, handler) => {
      const viewport = document.querySelector(selector) as HTMLElement | null;
      if (!viewport) return;

      e.preventDefault();

      const scrollAmount = viewport.clientHeight * 0.85; // Scroll ~85% of screen height

      if (handler.keys?.includes("pagedown")) {
        viewport.scrollBy({ top: scrollAmount });
      } else if (handler.keys?.includes("pageup")) {
        viewport.scrollBy({ top: -scrollAmount });
      } else if (handler.keys?.includes("home")) {
        viewport.scrollTo({ top: 0 });
      } else if (handler.keys?.includes("end")) {
        viewport.scrollTo({ top: viewport.scrollHeight });
      }
    },
    { enabled, enableOnFormTags: false, scopes: ["reader"] },
  );
};
