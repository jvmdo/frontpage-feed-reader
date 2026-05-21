import { parseAsBoolean, useQueryState } from "nuqs";

export function useSearchPaletteState() {
  return useQueryState(
    "searchPalette",
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
    }),
  );
}
