import { useSyncExternalStore } from "react";
import {
  getTickerServerSnapshot,
  getTickerSnapshot,
  subscribeToTicker,
} from "@/lib/ticker";

export function useTicker() {
  return useSyncExternalStore(
    subscribeToTicker,
    getTickerSnapshot,
    getTickerServerSnapshot,
  );
}
