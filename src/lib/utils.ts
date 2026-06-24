import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAnonName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    style: "capital",
  });
}

/**
 * Checks if the event target is an editable element (input, textarea, select, or contenteditable).
 * Used to prevent global keyboard shortcuts from firing when typing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/**
 * Normalizes a URL string by trimming whitespace, converting protocol/host to lowercase,
 * removing trailing slashes from the pathname (if not the root path "/"),
 * and removing hash fragments.
 */
export function normalizeUrl(urlString: string): string {
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return "";

    const url = new URL(trimmed);
    let pathname = url.pathname;

    // Remove trailing slash if pathname is longer than "/"
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    // Remove hash
    url.hash = "";

    return `${url.protocol}//${url.host}${pathname}${url.search}`;
  } catch {
    return urlString.trim();
  }
}
