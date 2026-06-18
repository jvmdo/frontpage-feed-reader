import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ReaderWidthValues = ["50vw", "65vw", "80vw"] as const;
export type ReaderWidth = (typeof ReaderWidthValues)[number];

interface ReaderState {
  readerWidth: ReaderWidth;
  setReaderWidth: (width: ReaderWidth) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      readerWidth: "50vw",
      setReaderWidth: (readerWidth) => set({ readerWidth }),
    }),
    {
      name: "frontpage_reader_preferences",
    },
  ),
);
