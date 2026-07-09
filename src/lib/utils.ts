import { type ClassValue, clsx } from "clsx";
import normalizeUrlLib from "normalize-url";
import { twMerge } from "tailwind-merge";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { settings } from "@/env";

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
 * Generates initials from a full name (up to 2 characters).
 */
export function getInitials(name?: string | null): string {
  if (!name) return "CS";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

/**
 * Returns an absolute URL for server-side fetches or a relative URL for client-side fetches.
 * Prevents Next.js SSR from crashing because relative URLs calls during SSR.
 */
export function getAbsoluteUrl(path: string): string {
  if (typeof window !== "undefined") return path;
  return `${settings.baseUrl}${path}`;
}
