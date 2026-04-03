import Parser from "rss-parser";
import {
  FeedInvalidFormatError,
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
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
    let response: Response;

    try {
      response = await fetch(url, {
        signal: controller.signal,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : undefined;
      throw new FeedNetworkError(message);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new FeedNotFoundError();
      }

      throw new FeedUnavailableError();
    }

    try {
      const xml = await response.text();
      const feed = await parser.parseString(xml);

      return {
        title: decodeEntities(feed.title),
        description: decodeEntities(feed.description),
        link: feed.link,
        feedUrl: feed.feedUrl || url,
      };
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : undefined;
      throw new FeedInvalidFormatError(message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
