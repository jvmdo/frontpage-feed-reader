import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AutoMarkReadMode } from "@/lib/validations/user";

interface PreferencesState {
  autoMarkReadMode: AutoMarkReadMode;
  autoMarkReadDelay: number; // seconds
  setAutoMarkRead: (mode: AutoMarkReadMode, delay: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      autoMarkReadMode: "immediately",
      autoMarkReadDelay: 5,
      setAutoMarkRead: (autoMarkReadMode, autoMarkReadDelay) =>
        set({ autoMarkReadMode, autoMarkReadDelay }),
    }),
    {
      name: "frontpage_user_preferences",
    },
  ),
);
