import {
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";

/**
 * Fetches the raw XML content of a feed from a URL.
 * Handles timeouts, network errors, and non-OK responses.
 */
export async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    let response: Response;

    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Frontpage Feed Reader/1.0",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
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

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}
