import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  isTourActive: boolean;
  isTourCompleted: boolean;
  isWaitingForFeed: boolean;
  prefillUrl: string | null;
  setTourActive: (active: boolean) => void;
  setTourCompleted: (completed: boolean) => void;
  setIsWaitingForFeed: (waiting: boolean) => void;
  setPrefillUrl: (url: string | null) => void;
  reset: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      isTourActive: false,
      isTourCompleted: false,
      isWaitingForFeed: false,
      prefillUrl: null,
      setTourActive: (active) => set({ isTourActive: active }),
      setTourCompleted: (completed) => set({ isTourCompleted: completed }),
      setIsWaitingForFeed: (waiting) => set({ isWaitingForFeed: waiting }),
      setPrefillUrl: (url) => set({ prefillUrl: url }),
      reset: () =>
        set({
          isTourActive: false,
          isTourCompleted: false,
          isWaitingForFeed: false,
          prefillUrl: null,
        }),
    }),
    {
      name: "frontpage_welcome_tour",
      partialize: (state) => ({ isTourCompleted: state.isTourCompleted }),
    },
  ),
);
