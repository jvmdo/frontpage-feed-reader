import { transformEmbeds } from "./embeds";
import { extractText } from "./extractor";
import {
  decodeEntities,
  normalizeAuthor,
  normalizeDate,
  normalizeUrl,
} from "./normalizer";
import { sanitizeHtml } from "./sanitizer";

export interface ProcessedItem {
  guid: string;
  url?: string;
  title: string;
  description: string;
  content: string;
  textContent: string;
  author?: string;
  publishedAt: Date;
  updatedAt: Date;
  rawPayload: any;
}

/**
 * Processes a raw feed item into a structured, sanitized, and normalized format.
 *
 * Separation of concerns:
 * - title: Plain text (no HTML tags)
 * - content: Safe HTML (for Reader)
 * - description: Plain text snippet (for List)
 * - textContent: Full plain text (for Search)
 */
export function processItem(
  item: any,
  sourceUrl?: string,
  feedLink?: string,
): ProcessedItem {
  // 1. Title (Clean Plain Text)
  const rawTitle = decodeEntities(item.title) || "Untitled Item";
  const title = extractText(rawTitle);

  // 2. Content (Safe HTML)
  const rawContent =
    item.contentEncoded ||
    item.content ||
    item.summary ||
    item.descriptionRaw ||
    "";
  const embeddedContent = transformEmbeds(rawContent);
  const content = sanitizeHtml(embeddedContent, feedLink || sourceUrl);

  // 3. Plain Text Derivatives
  const textContent = extractText(rawContent);
  const rawDescription = item.summary || item.descriptionRaw || rawContent;
  const description = extractText(rawDescription).slice(0, 500).trim();

  // 4. Metadata & URLs
  const url = normalizeUrl(item.link, feedLink || sourceUrl);
  const author = normalizeAuthor(item.creator || item.author);
  const publishedAt = normalizeDate(item.pubDate || item.isoDate);
  const updatedAt = normalizeDate(item.isoDate);

  // 5. GUID
  const guid =
    item.guid || item.id || generateDeterministicGuid(url || "", title);

  return {
    guid,
    url,
    title,
    description,
    content,
    textContent,
    author,
    publishedAt,
    updatedAt,
    rawPayload: item,
  };
}

/**
 * Generates a deterministic GUID based on URL and Title.
 */
function generateDeterministicGuid(url: string, title: string): string {
  // We can't use crypto.createHash easily in edge or some environments if we aren't careful,
  // but since this is currently running in Node/Bun context it's fine.
  // Re-using the logic from parser.ts
  const { createHash } = require("node:crypto");
  const hash = createHash("sha256");
  hash.update(url + title);
  return hash.digest("hex");
}
