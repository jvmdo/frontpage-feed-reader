import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { FeedInvalidFormatError } from "@/lib/errors";
import {
  cleanText,
  decodeEntities,
  normalizeDate,
  normalizeUrl,
} from "./normalizer";
import { sanitizeHtml } from "./sanitizer";

/**
 * Custom fields extracted from the XML that aren't in the default RSS/Atom spec
 * normalization provided by rss-parser.
 */
interface CustomItem {
  contentEncoded?: string;
  descriptionRaw?: string;
  id?: string;
  author?: string;
}

// biome-ignore lint/suspicious/noEmptyInterface: Future
interface CustomFeed {
  // Add custom feed-level fields here if needed
}

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["description", "descriptionRaw"],
    ],
  },
});

export interface FeedMetadata {
  title: string;
  description: string;
  link?: string;
  iconUrl?: string;
}

export interface Item {
  guid: string;
  url?: string;
  title: string;
  description: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  rawPayload: any;
}

export interface FullFeed {
  metadata: FeedMetadata;
  items: Item[];
}

/**
 * Parses raw XML content into a structured feed object.
 */
export async function parseFeedXml(
  xml: string,
  sourceUrl?: string,
): Promise<FullFeed> {
  try {
    const feed = await parser.parseString(xml);

    const feedLink = normalizeUrl(feed.link, sourceUrl);

    // Extract icon from the feed or fallback to Google's favicon service
    let iconUrl = feed.image?.url;
    if (!iconUrl && feedLink) {
      try {
        const domain = new URL(feedLink).hostname;
        iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch {
        // Ignore invalid URLs
      }
    }

    const items: Item[] = feed.items.map((item) => {
      const rawTitle = decodeEntities(item.title) || "Untitled Item";
      const title = cleanText(rawTitle);
      const rawDescription = decodeEntities(
        item.descriptionRaw || item.summary || item.contentSnippet,
      );
      const rawContent = item.contentEncoded || item.content;

      const description = neutralizeHtml(
        sanitizeHtml(cleanText(rawDescription || rawContent)),
      );
      const content = sanitizeHtml(rawContent);
      const url = normalizeUrl(item.link, feedLink || sourceUrl);
      const guid =
        item.guid || item.id || generateDeterministicGuid(url || "", title);

      return {
        guid,
        url,
        title,
        description,
        content,
        author: cleanText(decodeEntities(item.creator || item.author)),
        publishedAt: normalizeDate(item.pubDate || item.isoDate),
        updatedAt: normalizeDate(item.isoDate),
        rawPayload: item,
      };
    });

    return {
      metadata: {
        title: cleanText(decodeEntities(feed.title)) || "Untitled Feed",
        description: cleanText(decodeEntities(feed.description)) || "",
        link: feedLink,
        iconUrl,
      },
      items,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : undefined;
    throw new FeedInvalidFormatError(message);
  }
}

/**
 * Neutralizes all focusable elements in HTML by adding tabindex="-1" to all tags.
 * This is used for descriptions (excerpts) used in the feed list to prevent
 * accidental focus during tabbing while keeping content accessible to AT.
 */
function neutralizeHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<([a-z0-9-]+)(?=[ >/])/gi, '<$1 tabindex="-1"');
}

/**
 * Generates a deterministic GUID based on URL and Title.
 */
function generateDeterministicGuid(url: string, title: string): string {
  const hash = createHash("sha256");
  hash.update(url + title);
  return hash.digest("hex");
}
