"use client";

import { useEventListener } from "usehooks-ts";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import { isEditableTarget } from "@/lib/utils";

/**
 * SearchShortcutListener registers global keyboard shortcuts for the search palette.
 * It is statically loaded in the layout so shortcuts are immediately active after hydration,
 * even while the heavier SearchPalette component is being loaded dynamically.
 */
export function SearchShortcutListener() {
  const [, setOpen] = useSearchPaletteState();

  useEventListener("keydown", (e) => {
    if (isEditableTarget(e.target)) return;

    const isCmdK = (e.metaKey || e.ctrlKey) && e.key === "k";
    const isSlash = e.key === "/";

    if (isCmdK || isSlash) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  });

  return null;
}
