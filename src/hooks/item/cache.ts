import type { InfiniteData } from "@tanstack/react-query";

/**
 * A generic type representing TanStack Query's paginated data or single-entity data.
 */
export type GenericCacheData<TElement, TSingle = TElement> =
  | InfiniteData<TElement[]>
  | TSingle;

/**
 * Searches through query cache entries to find an element using a predicate.
 */
export function findInCache<TElement, TSingle = TElement>(
  queries: [
    readonly unknown[],
    GenericCacheData<TElement, TSingle> | undefined,
  ][],
  predicate: (item: TElement | TSingle) => boolean,
): TElement | TSingle | null {
  for (const [_, data] of queries) {
    if (!data) continue;

    if (
      typeof data === "object" &&
      "pages" in data &&
      Array.isArray(data.pages)
    ) {
      for (const page of data.pages) {
        if (!Array.isArray(page)) continue;
        const found = page.find(predicate as (val: TElement) => boolean);
        if (found) return found;
      }
    } else if (data && typeof data === "object") {
      if (predicate(data as TSingle)) {
        return data as TSingle;
      }
    }
  }

  return null;
}

/**
 * Map-updates a target element inside the cache data structure (supporting both
 * paginated infinite queries and single-entity layouts).
 */
export function updateInCache<TData extends GenericCacheData<any, any>>(
  old: TData | undefined,
  predicate: (item: any) => boolean,
  updater: (item: any) => any,
): TData | undefined {
  if (!old) return old;

  if (typeof old === "object" && "pages" in old && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page) => {
        if (!Array.isArray(page)) return page;
        return page.map((i) => (predicate(i) ? updater(i) : i));
      }),
    } as TData;
  }

  if (old && typeof old === "object") {
    if (predicate(old)) {
      return updater(old) as TData;
    }
  }

  return old;
}

/**
 * Filters out matching elements from the cache data structure (supporting both
 * paginated infinite queries and single-entity layouts).
 */
export function filterFromCache<TData extends GenericCacheData<any, any>>(
  old: TData | undefined,
  predicate: (item: any) => boolean,
): TData | undefined {
  if (!old) return old;

  if (typeof old === "object" && "pages" in old && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page) => {
        if (!Array.isArray(page)) return page;
        return page.filter((i) => !predicate(i));
      }),
    } as TData;
  }

  if (old && typeof old === "object") {
    if (predicate(old)) {
      return undefined;
    }
  }

  return old;
}
