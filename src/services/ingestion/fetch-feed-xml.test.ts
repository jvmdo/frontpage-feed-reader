import { delay, HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WELCOME_FEED_URL } from "@/lib/constants";
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
        return new HttpResponse(FEED_CONTENT, {
          headers: {
            "Content-Type": "application/rss+xml",
            ETag: 'W/"12345"',
            "Last-Modified": "Wed, 21 Oct 2015 07:28:00 GMT",
          },
        });
      }),
    );

    const result = await fetchFeedXml(FEED_URL);

    expect(result).toEqual({
      status: "success",
      xml: FEED_CONTENT,
      etag: 'W/"12345"',
      lastModified: "Wed, 21 Oct 2015 07:28:00 GMT",
      finalUrl: FEED_URL,
    });
  });

  it("returns not_modified status on HTTP 304", async () => {
    server.use(
      http.get(FEED_URL, () => {
        return new HttpResponse(null, { status: 304 });
      }),
    );

    const result = await fetchFeedXml(FEED_URL, {
      etag: 'W/"12345"',
      lastModified: "Wed, 21 Oct 2015 07:28:00 GMT",
    });

    expect(result).toEqual({ status: "not_modified" });
  });

  it("includes the correct User-Agent, Accept, and Conditional headers", async () => {
    let capturedHeaders: Headers | undefined;

    server.use(
      http.get(FEED_URL, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.xml(FEED_CONTENT);
      }),
    );

    await fetchFeedXml(FEED_URL, {
      etag: 'W/"12345"',
      lastModified: "Wed, 21 Oct 2015 07:28:00 GMT",
    });

    expect(capturedHeaders?.get("User-Agent")).toBe(
      "Frontpage Feed Reader/1.0",
    );
    expect(capturedHeaders?.get("Accept")).toContain("application/rss+xml");
    expect(capturedHeaders?.get("If-None-Match")).toBe('W/"12345"');
    expect(capturedHeaders?.get("If-Modified-Since")).toBe(
      "Wed, 21 Oct 2015 07:28:00 GMT",
    );
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

  describe("local welcome feed bypass", () => {
    it("returns XML without making a network request for WELCOME_FEED_URL", async () => {
      const result = await fetchFeedXml(WELCOME_FEED_URL);

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.xml).toContain("<rss");
        expect(result.etag).toBeNull();
        expect(result.lastModified).toBeNull();
        expect(result.finalUrl).toBe(WELCOME_FEED_URL);
      }
    });

    it("returns fresh XML on every call (no caching)", async () => {
      const first = await fetchFeedXml(WELCOME_FEED_URL);
      const second = await fetchFeedXml(WELCOME_FEED_URL);

      expect(first.status).toBe("success");
      expect(second.status).toBe("success");
    });
  });
});
