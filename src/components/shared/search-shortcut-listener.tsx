"use client";

import { Suspense } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";

/**
 * SearchShortcutListener registers global keyboard shortcuts for the search palette.
 * It is statically-safe loaded in the layout so shortcuts are immediately active after hydration,
 * even while the heavier SearchPalette component is being loaded dynamically.
 */
export function SearchShortcutListener() {
  return (
    <Suspense fallback={null}>
      <Listener />
    </Suspense>
  );
}
function Listener() {
  const [, setOpen] = useSearchPaletteState();

  useHotkeys(
    ["meta+k", "ctrl+k", "Slash"],
    (e) => {
      e.preventDefault();
      setOpen((prev) => !prev);
    },
    { enableOnFormTags: false },
  );

  return null;
}
