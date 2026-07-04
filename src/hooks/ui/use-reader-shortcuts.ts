import { useHotkeys } from "react-hotkeys-hook";

interface UseReaderShortcutsOptions {
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onToggleRead?: () => void;
  onToggleBookmark?: () => void;
  enabled: boolean;
}

/**
 * Hook to handle keyboard shortcuts in the Reader View.
 * Supports Navigation (j/k, Arrows) and Read Toggle (m)
 */
export function useReaderShortcuts({
  onNext,
  onPrev,
  onClose,
  onToggleRead,
  onToggleBookmark,
  enabled,
}: UseReaderShortcutsOptions) {
  useHotkeys(
    ["j", "arrowright"],
    (e) => {
      e.preventDefault();
      onNext();
    },
    { enabled, enableOnFormTags: false, scopes: ["reader"] },
  );

  useHotkeys(
    ["k", "arrowleft"],
    (e) => {
      e.preventDefault();
      onPrev();
    },
    { enabled, enableOnFormTags: false, scopes: ["reader"] },
  );

  useHotkeys(
    "m",
    (e) => {
      if (onToggleRead) {
        e.preventDefault();
        onToggleRead();
      }
    },
    {
      enabled: enabled && !!onToggleRead,
      enableOnFormTags: false,
      scopes: ["reader"],
    },
  );

  useHotkeys(
    ["s", "b"],
    (e) => {
      if (onToggleBookmark) {
        e.preventDefault();
        onToggleBookmark();
      }
    },
    {
      enabled: enabled && !!onToggleBookmark,
      enableOnFormTags: false,
      scopes: ["reader"],
    },
  );

  useHotkeys(
    "o",
    (e) => {
      e.preventDefault();
      onClose();
    },
    { enabled, enableOnFormTags: false, scopes: ["reader"] },
  );
}
