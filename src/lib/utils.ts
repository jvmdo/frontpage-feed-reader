import { type ClassValue, clsx } from "clsx";
import normalizeUrlLib from "normalize-url";
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
 * Normalizes a URL string, converting protocol/host to lowercase,
 * removing trailing slashes from the pathname, stripping hash fragments, and sorting query parameters.
 */
export function normalizeUrl(urlString: string): string {
  try {
    return normalizeUrlLib(urlString, {
      stripWWW: false,
      stripHash: true,
      removeTrailingSlash: true,
      sortQueryParameters: true,
    });
  } catch {
    return urlString.trim();
  }
}
