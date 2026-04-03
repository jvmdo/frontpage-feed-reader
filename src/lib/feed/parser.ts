import Parser from "rss-parser";
import { decodeEntities } from "./normalizer";

const parser = new Parser();

export interface FeedMetadata {
  title?: string;
  description?: string;
  link?: string;
  feedUrl?: string;
}

/**
 * Fetches basic metadata for a feed.
 */
export async function fetchFeedMetadata(url: string): Promise<FeedMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    return {
      title: decodeEntities(feed.title),
      description: decodeEntities(feed.description),
      link: feed.link,
      feedUrl: feed.feedUrl || url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
