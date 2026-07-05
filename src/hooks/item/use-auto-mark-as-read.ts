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
  const lastOpenedItemIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !activeItemId ||
      !data ||
      lastOpenedItemIdRef.current === activeItemId ||
      data.isRead
    )
      return;
    lastOpenedItemIdRef.current = activeItemId;

    if (autoMarkReadMode === "immediately") {
      setReadStatus({ itemId: activeItemId, isRead: true });
      return;
    }

    if (autoMarkReadMode === "delayed") {
      const timer = setTimeout(() => {
        setReadStatus({ itemId: activeItemId, isRead: true });
      }, autoMarkReadDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [activeItemId, data, autoMarkReadMode, autoMarkReadDelay, setReadStatus]);
}
