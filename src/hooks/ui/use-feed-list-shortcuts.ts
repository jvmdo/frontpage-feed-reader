import { useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { VirtuosoHandle } from "react-virtuoso";

interface UseFeedListShortcutsOptions {
  totalItems: number;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
  onOpen: (index: number) => void;
  onToggleRead: (index: number) => void;
  onToggleBookmark: (index: number) => void;
  enabled: boolean;
  resetKey?: string;
}

export function useFeedListShortcuts({
  totalItems,
  virtuosoRef,
  onOpen,
  onToggleRead,
  onToggleBookmark,
  enabled,
  resetKey,
}: UseFeedListShortcutsOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: should react to this variable
  useEffect(() => {
    setFocusedIndex(null);
  }, [resetKey]);

  const moveFocus = useCallback(
    (direction: 1 | -1) => {
      if (totalItems === 0) return;

      setFocusedIndex((prev) => {
        let next = prev === null ? 0 : prev + direction;
        if (next < 0) next = 0;
        if (next >= totalItems) next = totalItems - 1;

        // Ensure the focused item is visible in the list
        if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: next,
            align: "center",
            behavior: "smooth",
          });
        }

        return next;
      });
    },
    [totalItems, virtuosoRef],
  );

  useHotkeys(
    ["j", "arrowdown"],
    (e) => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      e.preventDefault();
      moveFocus(1);
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  useHotkeys(
    ["k", "arrowup"],
    (e) => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      e.preventDefault();
      moveFocus(-1);
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  useHotkeys(
    ["o", "enter"],
    (e) => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      if (focusedIndex !== null) {
        e.preventDefault();
        onOpen(focusedIndex);
      }
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  useHotkeys(
    "m",
    (e) => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      if (focusedIndex !== null) {
        e.preventDefault();
        onToggleRead(focusedIndex);
      }
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  useHotkeys(
    ["s", "b"],
    (e) => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      if (focusedIndex !== null) {
        e.preventDefault();
        onToggleBookmark(focusedIndex);
      }
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  useHotkeys(
    "escape",
    (e) => {
      if (e.defaultPrevented) return;
      if (document.body.hasAttribute("data-scroll-locked")) return;

      if (focusedIndex !== null) {
        e.preventDefault();
        setFocusedIndex(null);
      }
    },
    { enabled, enableOnFormTags: false, scopes: ["list"] },
  );

  return { focusedIndex, setFocusedIndex };
}
