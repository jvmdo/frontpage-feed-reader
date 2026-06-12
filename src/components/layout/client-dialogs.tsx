"use client";

import dynamic from "next/dynamic";

const ItemReaderLightbox = dynamic(
  () =>
    import("@/components/reader/item-reader-lightbox").then(
      (m) => m.ItemReaderLightbox,
    ),
  { ssr: false },
);

const SearchPalette = dynamic(
  () =>
    import("@/components/shared/search-palette").then((m) => m.SearchPalette),
  { ssr: false },
);

export function ClientDialogs() {
  return (
    <>
      <ItemReaderLightbox />
      <SearchPalette />
    </>
  );
}
