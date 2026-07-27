import Parser from "rss-parser";
import { FeedInvalidFormatError } from "@/lib/errors";
import { cleanText, decodeEntities, resolveRelativeUrl } from "./normalizer";
import { type ProcessedItem, processItem } from "./processor";

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

export interface FullFeed {
  metadata: FeedMetadata;
  items: ProcessedItem[];
}

export interface ParseFeedOptions {
  metadataOnly?: boolean;
}

/**
 * Parses raw XML content into a structured feed object.
 */
export async function parseFeedXml(
  xml: string,
  sourceUrl?: string,
  options: ParseFeedOptions = {},
): Promise<FullFeed> {
  try {
    const feed = await parser.parseString(xml);
    const feedLink = resolveRelativeUrl(feed.link, sourceUrl);

    // Extract icon from the feed or fallback to Google's favicon service
    let iconUrl = resolveRelativeUrl(feed.image?.url, feedLink || sourceUrl);
    if (!iconUrl && feedLink) {
      try {
        const domain = new URL(feedLink).hostname;
        iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch {
        // Ignore invalid URLs
      }
    }

    const metadata: FeedMetadata = {
      title: cleanText(decodeEntities(feed.title)) || "Untitled Feed",
      description: cleanText(decodeEntities(feed.description)) || "",
      link: feedLink,
      iconUrl,
    };

    if (options.metadataOnly) {
      return {
        metadata,
        items: [],
      };
    }

    const items = await Promise.all(
      feed.items.map((item) => processItem(item, sourceUrl, feedLink)),
    );

    return {
      metadata,
      items,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : undefined;
    throw new FeedInvalidFormatError(message);
  }
}
