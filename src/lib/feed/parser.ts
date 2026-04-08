import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { FeedInvalidFormatError } from "@/lib/errors";
import { decodeEntities } from "./normalizer";

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
export async function parseFeedXml(xml: string): Promise<FullFeed> {
  try {
    const feed = await parser.parseString(xml);

    const items: FeedItem[] = feed.items.map((item) => {
      const title = decodeEntities(item.title) || "Untitled Article";
      const description =
        decodeEntities(item.contentSnippet || item.summary) || "";
      const content = item.contentEncoded || item.content;
      const guid =
        item.guid ||
        item.id ||
        generateDeterministicGuid(item.link || "", title);

      return {
        guid,
        url: item.link,
        title,
        description,
        content,
        author: item.creator || item.author,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        updatedAt: item.isoDate ? new Date(item.isoDate) : undefined,
        rawPayload: item,
      };
    });

    return {
      metadata: {
        title: decodeEntities(feed.title) || "Untitled Feed",
        description: decodeEntities(feed.description) || "",
        link: feed.link,
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
