import {
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";

/**
 * Result of a feed fetch operation.
 */
export type FetchFeedResult =
  | {
      status: "success";
      xml: string;
      etag: string | null;
      lastModified: string | null;
    }
  | { status: "not_modified" };

/**
 * Fetches the raw XML content of a feed from a URL.
 * Handles timeouts, network errors, and non-OK responses.
 * Supports conditional GET using ETag and Last-Modified headers.
 */
export async function fetchFeedXml(
  url: string,
  options: { etag?: string | null; lastModified?: string | null } = {},
): Promise<FetchFeedResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    let response: Response;

    const headers: Record<string, string> = {
      "User-Agent": "Frontpage Feed Reader/1.0",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    };

    if (options.etag) {
      headers["If-None-Match"] = options.etag;
    }

    if (options.lastModified) {
      headers["If-Modified-Since"] = options.lastModified;
    }

    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : undefined;
      throw new FeedNetworkError(message);
    }

    if (response.status === 304) {
      return { status: "not_modified" };
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new FeedNotFoundError();
      }
      throw new FeedUnavailableError();
    }

    const xml = await response.text();
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    return {
      status: "success",
      xml,
      etag,
      lastModified,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
