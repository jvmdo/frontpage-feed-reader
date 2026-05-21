"use client";

import { Loader2Icon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useDebounceValue, useEventListener } from "usehooks-ts";
import { FeedIcon } from "@/components/feed/feed-icon";
import { RelativeDate } from "@/components/shared/relative-date";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
import { useSearchItems } from "@/hooks/item/use-search-items";
import { useSearchPaletteState } from "@/hooks/ui/use-search-palette-state";
import { cn } from "@/lib/utils";
import type { ListItemWithSource } from "@/types";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

/**
 * Global search palette component.
 * Managed via the `searchPalette=true` URL parameter.
 */
export function SearchPalette() {
  const [search, setSearch] = useState("");
  const [debouncedValue] = useDebounceValue(search, 500);
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSearchItems(debouncedValue);

  // Flatten the infinite query pages into a single array
  const results = data?.pages.flat() ?? [];

  const [open, setOpen] = useSearchPaletteState();
  const router = useRouter();
  const pathname = usePathname();

  // Toggle palette with keyboard shortcuts
  useEventListener("keydown", (e) => {
    if (isEditableTarget(e.target)) return;

    const isCmdK = (e.metaKey || e.ctrlKey) && e.key === "k";
    const isSlash = e.key === "/";

    if (isCmdK || isSlash) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  });

  const onSelect = (item: ListItemWithSource) => {
    const params = new URLSearchParams(window.location.search);
    params.set("itemId", item.item.id.toString());
    params.delete("searchPalette");

    router.push(`${pathname}?${params.toString()}`);
  };

  const isStale = search !== debouncedValue;
  const isSearching = isStale || (debouncedValue.length >= 2 && isPending);
  const showHint = !isSearching && search.length < 2;
  const showError = !isSearching && isError;
  const showEmpty =
    !isSearching &&
    !isError &&
    debouncedValue.length >= 2 &&
    results.length === 0;
  const showResults =
    !isSearching &&
    !isError &&
    debouncedValue.length >= 2 &&
    results.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search your articles..."
          value={search}
          onValueChange={setSearch}
          className="flex-1"
        />
        <CommandList className="[scrollbar-width:auto] [::-webkit-scrollbar]:block">
          {showHint && (
            <CommandEmpty>Start typing to search (min 2 chars)</CommandEmpty>
          )}

          {isSearching && <CommandSearching>Searching...</CommandSearching>}

          {showEmpty && (
            <CommandEmpty>
              No results found for "{debouncedValue}".
            </CommandEmpty>
          )}

          {showError && (
            <CommandEmpty>Something went wrong. Please try again.</CommandEmpty>
          )}

          {showResults && (
            <>
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <SearchResultItem
                    key={result.item.id}
                    result={result}
                    onSelect={onSelect}
                  />
                ))}
              </CommandGroup>

              {/* FIXME: Focus trap. Focus should move to the first fetched item */}
              {hasNextPage && (
                <CommandItem
                  onSelect={() => !isFetchingNextPage && fetchNextPage()}
                  aria-disabled={isFetchingNextPage}
                  className={cn(
                    "flex justify-center text-xs text-muted-foreground data-selected:text-primary cursor-pointer mb-2 md:mx-40 [&>svg]:hidden",
                    isFetchingNextPage && "opacity-50 cursor-wait",
                  )}
                >
                  {isFetchingNextPage ? (
                    <CommandSearching>Searching more...</CommandSearching>
                  ) : (
                    "Load more results"
                  )}
                </CommandItem>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

function SearchResultItem({
  result,
  onSelect,
}: {
  result: ListItemWithSource;
  onSelect: (item: ListItemWithSource) => void;
}) {
  return (
    <CommandItem
      onSelect={() => onSelect(result)}
      className="p-3 flex flex-col items-start gap-1 mr-1 group [&>svg]:hidden"
    >
      <header className="w-full flex items-center justify-between gap-2">
        <div className="grow flex items-center gap-1 min-w-0">
          <FeedIcon
            url={result.feed.iconUrl || result.feed.url}
            title={result.feed.title || "Untitled Feed"}
            size={14}
            categoryColor={result.categoryColor}
          />
          <span className="text-xs text-muted-foreground truncate">
            {result.feed.title || "Untitled Feed"}
          </span>
          <RelativeDate
            date={result.item.publishedAt || result.item.createdAt}
            className="text-xs text-muted-foreground whitespace-nowrap ml-auto"
          />
        </div>
        {!result.isRead && (
          <div className="size-1.5 rounded-full bg-unread-indicator" />
        )}
      </header>

      <h3 className="text-sm font-semibold leading-tight group-hover:text-primary group-data-selected:text-primary transition-colors">
        {result.item.title || "Untitled Item"}
      </h3>

      {result.searchSnippet && (
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted content from Postgres
          dangerouslySetInnerHTML={{ __html: result.searchSnippet }}
          className="text-xs text-muted-foreground overflow-hidden line-clamp-2"
        />
      )}
    </CommandItem>
  );
}

function CommandSearching({ children }: { children: ReactNode }) {
  return (
    <CommandLoading
      ref={(node) => {
        if (typeof node?.scrollIntoView === "function") {
          node.scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      <div
        className="flex gap-1 items-center justify-center py-6 text-muted-foreground text-sm"
        role="status"
      >
        <Loader2Icon className="size-4 animate-spin" />
        {children}
      </div>
    </CommandLoading>
  );
}
