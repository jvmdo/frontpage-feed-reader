import { delay, HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FeedNetworkError,
  FeedNotFoundError,
  FeedUnavailableError,
} from "@/lib/errors";
import { server } from "@/tests/mocks/server";
import { fetchFeedXml } from "./fetch-feed-xml";

describe("fetchFeedXml", () => {
  const FEED_URL = "https://example.com/feed.xml";
  const FEED_CONTENT =
    '<?xml version="1.0"?><rss><channel><title>Test Feed</title></channel></rss>';

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches feed content successfully", async () => {
    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.xml(FEED_CONTENT);
      }),
    );

    const result = await fetchFeedXml(FEED_URL);
    expect(result).toBe(FEED_CONTENT);
  });

  it("includes the correct User-Agent and Accept headers", async () => {
    let capturedHeaders: Headers | undefined;

    server.use(
      http.get(FEED_URL, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.xml(FEED_CONTENT);
      }),
    );

    await fetchFeedXml(FEED_URL);

    expect(capturedHeaders?.get("User-Agent")).toBe(
      "Frontpage Feed Reader/1.0",
    );
    expect(capturedHeaders?.get("Accept")).toContain("application/rss+xml");
    expect(capturedHeaders?.get("Accept")).toContain("application/atom+xml");
  });

  it("throws FeedNotFoundError on 404", async () => {
    server.use(
      http.get(FEED_URL, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await expect(fetchFeedXml(FEED_URL)).rejects.toThrow(FeedNotFoundError);
  });

  it("throws FeedUnavailableError on 500", async () => {
    server.use(
      http.get(FEED_URL, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(fetchFeedXml(FEED_URL)).rejects.toThrow(FeedUnavailableError);
  });

  it("throws FeedNetworkError on network failure", async () => {
    server.use(
      http.get(FEED_URL, () => {
        return HttpResponse.error();
      }),
    );

    await expect(fetchFeedXml(FEED_URL)).rejects.toThrow(FeedNetworkError);
  });

  it("times out after 10 seconds", async () => {
    vi.useFakeTimers();

    server.use(
      http.get(FEED_URL, async () => {
        await delay("infinite");
        return HttpResponse.xml(FEED_CONTENT);
      }),
    );

    const fetchPromise = fetchFeedXml(FEED_URL);

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10001);

    await expect(fetchPromise).rejects.toThrow(FeedNetworkError);
  });
});
