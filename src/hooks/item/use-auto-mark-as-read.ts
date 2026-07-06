import { useEffect, useRef } from "react";
import { usePreferencesStore } from "@/hooks/ui/use-preferences-store";
import type { ItemWithSource } from "@/types";

interface UseAutoMarkAsReadOptions {
  activeItemId: number | null;
  data: ItemWithSource | undefined;
  setReadStatus: (payload: { itemId: number; isRead: boolean }) => void;
}

export function useAutoMarkAsRead({
  activeItemId,
  data,
  setReadStatus,
}: UseAutoMarkAsReadOptions) {
  const autoMarkReadMode = usePreferencesStore((s) => s.autoMarkReadMode);
  const autoMarkReadDelay = usePreferencesStore((s) => s.autoMarkReadDelay);
  const processedItemIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer when the active item changes or component unmounts
  // biome-ignore lint/correctness/useExhaustiveDependencies: it shall react to
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeItemId]);

  useEffect(() => {
    if (autoMarkReadMode === "manual") return;

    if (!activeItemId || !data) return;

    // If we have already processed this item for the current visit, do nothing.
    // This prevents re-triggering if `data` updates (e.g. background refetch).
    if (processedItemIdRef.current === activeItemId) return;

    processedItemIdRef.current = activeItemId;

    // If it's already read, we have nothing to do
    if (data.isRead) return;

    if (autoMarkReadMode === "immediately") {
      setReadStatus({ itemId: activeItemId, isRead: true });
      return;
    }

    if (autoMarkReadMode === "delayed") {
      timerRef.current = setTimeout(() => {
        setReadStatus({ itemId: activeItemId, isRead: true });
      }, autoMarkReadDelay * 1000);
    }
  }, [activeItemId, data, autoMarkReadMode, autoMarkReadDelay, setReadStatus]);
}
