import { transformEmbeds } from "./embeds";
import { extractText } from "./extractor";
import {
  decodeEntities,
  normalizeAuthor,
  normalizeDate,
  normalizeUrl,
} from "./normalizer";
import { sanitizeHtml } from "./sanitizer";
import { highlightCodeBlocks } from "./syntax";

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
export async function processItem(
  item: any,
  sourceUrl?: string,
  feedLink?: string,
): Promise<ProcessedItem> {
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
  const highlightedContent = highlightCodeBlocks(embeddedContent);
  const content = sanitizeHtml(highlightedContent, feedLink || sourceUrl);

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
    item.guid || item.id || (await generateDeterministicGuid(url || "", title));

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
 * Generates a deterministic GUID based on URL and Title using the Web Crypto API.
 */
async function generateDeterministicGuid(
  url: string,
  title: string,
): Promise<string> {
  const data = new TextEncoder().encode(url + title);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
