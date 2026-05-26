import { isValid, parse } from "date-fns";
import { decodeHTML } from "entities";

/**
 * Decodes HTML entities in a string.
 */
export function decodeEntities(text: string | undefined | null): string {
  if (!text) return "";
  return decodeHTML(text);
}

/**
 * Trims whitespace and normalizes line breaks in a string.
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n") // Normalize CRLF to LF
    .replace(/\r/g, "\n") // Normalize CR to LF
    .replace(/[ \t]+/g, " ") // Normalize multiple spaces/tabs to single space
    .trim();
}

/**
 * Parses and normalizes a date string, falling back to current time if invalid.
 */
export function normalizeDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();

  // Try native Date constructor first
  const date = new Date(dateStr);
  if (isValid(date)) return date;

  // Common non-standard formats fallback using date-fns
  const formats = [
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd",
    "EEE, dd MMM yyyy HH:mm:ss", // Some feeds omit the TZ
    "dd MMM yyyy HH:mm:ss",
  ];

  for (const formatStr of formats) {
    try {
      const parsedDate = parse(dateStr, formatStr, new Date());
      if (isValid(parsedDate)) return parsedDate;
    } catch {}
  }

  return new Date();
}

/**
 * Normalizes a URL, resolving relative paths if a base is provided.
 */
export function normalizeUrl(
  url: string | undefined | null,
  base?: string,
): string | undefined {
  if (!url) return undefined;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return undefined;

  try {
    const absoluteUrl = new URL(trimmedUrl, base);
    return absoluteUrl.toString();
  } catch {
    return trimmedUrl;
  }
}

/**
 * Normalizes author names by removing prefixes, extracting from parentheses,
 * and converting slugs to title case.
 */
export function normalizeAuthor(
  author: string | undefined | null,
): string | undefined {
  if (!author) return undefined;

  let name = cleanText(decodeEntities(author));

  // 1. Remove "by" or "by," prefix (case insensitive)
  // handles: "by Author", "by, Author", "by \t Author"
  name = name.replace(/^by\s*,?\s*/i, "").trim();

  // 2. If it was just "by", it's empty
  if (!name || name.toLowerCase() === "by") return undefined;

  // 3. Extract from parentheses (Smashing Magazine style: email@domain.com (Author Name))
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    name = parenMatch[1].trim();
  }

  // 4. Convert kebab-case slugs to Title Case (MDN style: yash-raj-bharti)
  // Heuristic: No spaces, has dashes, and is all lowercase
  if (
    !name.includes(" ") &&
    name.includes("-") &&
    name === name.toLowerCase()
  ) {
    name = name
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return name || undefined;
}
