import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { FeedInvalidFormatError } from "@/lib/errors";
import {
  cleanText,
  decodeEntities,
  normalizeDate,
  normalizeUrl,
} from "./normalizer";

/**
 * Custom fields extracted from the XML that aren't in the default RSS/Atom spec
 * normalization provided by rss-parser.
 */
interface CustomItem {
  contentEncoded?: string;
  id?: string;
  author?: string;
}

// biome-ignore lint/suspicious/noEmptyInterface: Future
interface CustomFeed {
  // Add custom feed-level fields here if needed
}

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [["content:encoded", "contentEncoded"]],
  },
});

export interface FeedMetadata {
  title: string;
  description: string;
  link?: string;
}

export interface FeedItem {
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
  items: FeedItem[];
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

    const items: FeedItem[] = feed.items.map((item) => {
      const rawTitle = decodeEntities(item.title) || "Untitled Article";
      const title = cleanText(rawTitle);
      const description =
        cleanText(decodeEntities(item.contentSnippet || item.summary)) || "";
      const content = item.contentEncoded || item.content;
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
        publishedAt: normalizeDate(item.pubDate),
        updatedAt: normalizeDate(item.isoDate),
        rawPayload: item,
      };
    });

    return {
      metadata: {
        title: cleanText(decodeEntities(feed.title)) || "Untitled Feed",
        description: cleanText(decodeEntities(feed.description)) || "",
        link: feedLink,
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
 * Generates a deterministic GUID based on URL and Title.
 */
function generateDeterministicGuid(url: string, title: string): string {
  const hash = createHash("sha256");
  hash.update(url + title);
  return hash.digest("hex");
}
