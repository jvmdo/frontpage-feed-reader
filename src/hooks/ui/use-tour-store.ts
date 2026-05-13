import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  isTourActive: boolean;
  isTourCompleted: boolean;
  prefillUrl: string | null;
  setTourActive: (active: boolean) => void;
  setTourCompleted: (completed: boolean) => void;
  setPrefillUrl: (url: string | null) => void;
  reset: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      isTourActive: false,
      isTourCompleted: false,
      prefillUrl: null,
      setTourActive: (active) => set({ isTourActive: active }),
      setTourCompleted: (completed) => set({ isTourCompleted: completed }),
      setPrefillUrl: (url) => set({ prefillUrl: url }),
      reset: () =>
        set({
          isTourActive: false,
          isTourCompleted: false,
          prefillUrl: null,
        }),
    }),
    {
      name: "frontpage_tour_storage",
    },
  ),
);
