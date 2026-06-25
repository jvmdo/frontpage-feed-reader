import { describe, expect, it } from "vitest";
import { preprocessUrlInput } from "./url";

describe("preprocessUrlInput", () => {
  it("should trim leading and trailing spaces", () => {
    expect(preprocessUrlInput("   https://example.com/feed   ")).toBe(
      "https://example.com/feed",
    );
  });

  it("should handle empty or whitespace-only inputs", () => {
    expect(preprocessUrlInput("")).toBe("");
    expect(preprocessUrlInput("   ")).toBe("");
  });

  it("should translate feed://, rss://, web+feed://, and web+rss:// to https://", () => {
    expect(preprocessUrlInput("feed://example.com/feed")).toBe(
      "https://example.com/feed",
    );
    expect(preprocessUrlInput("rss://example.com/feed")).toBe(
      "https://example.com/feed",
    );
    expect(preprocessUrlInput("web+feed://example.com/feed")).toBe(
      "https://example.com/feed",
    );
    expect(preprocessUrlInput("web+rss://example.com/feed")).toBe(
      "https://example.com/feed",
    );
    expect(preprocessUrlInput("FEED://example.com/feed")).toBe(
      "https://example.com/feed",
    );
  });

  it("should prepend https:// to bare domains with pathnames", () => {
    expect(preprocessUrlInput("example.com/feed")).toBe(
      "https://example.com/feed",
    );
    expect(preprocessUrlInput("www.example.com/feed/")).toBe(
      "https://www.example.com/feed/",
    );
    expect(preprocessUrlInput("sub.domain.co.uk/feed.xml")).toBe(
      "https://sub.domain.co.uk/feed.xml",
    );
  });

  it("should prepend https:// to localhost domains", () => {
    expect(preprocessUrlInput("localhost:3000/feed.xml")).toBe(
      "https://localhost:3000/feed.xml",
    );
  });

  it("should preserve existing http:// and https:// protocols", () => {
    expect(preprocessUrlInput("http://example.com/feed")).toBe(
      "http://example.com/feed",
    );
    expect(preprocessUrlInput("https://example.com/feed")).toBe(
      "https://example.com/feed",
    );
  });

  it("should preserve trailing slashes, query params, and hashes", () => {
    // This helper only ensures protocol validation, leaving structural
    // normalization (like trailing slashes) to the server-side utility.
    expect(preprocessUrlInput("example.com/feed/?a=1#hash")).toBe(
      "https://example.com/feed/?a=1#hash",
    );
  });

  it("should not prepend protocol to strings that lack a domain structure", () => {
    expect(preprocessUrlInput("invalid-url")).toBe("invalid-url");
    expect(preprocessUrlInput("foo")).toBe("foo");
  });
});
