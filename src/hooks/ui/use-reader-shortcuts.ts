import { useEffect } from "react";
import { isEditableTarget } from "@/lib/utils";

interface UseReaderShortcutsOptions {
  onNext: () => void;
  onPrev: () => void;
  onToggleRead?: () => void;
  enabled: boolean;
}

/**
 * Hook to handle keyboard shortcuts in the Reader View.
 * Supports Navigation (j/k, Arrows) and Read Toggle (m)
 */
export function useReaderShortcuts({
  onNext,
  onPrev,
  onToggleRead,
  enabled,
}: UseReaderShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

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

      // 2. Action Shortcuts
      if (key === "m" && onToggleRead) {
        event.preventDefault();
        onToggleRead();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, onToggleRead, enabled]);
}
