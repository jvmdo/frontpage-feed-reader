import { create } from "zustand";

interface KeyboardShortcutsStore {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

export const useKeyboardShortcutsStore = create<KeyboardShortcutsStore>(
  (set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
  }),
);
