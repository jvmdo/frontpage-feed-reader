import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanText,
  decodeEntities,
  normalizeDate,
  normalizeUrl,
} from "./normalizer";

describe("decodeEntities", () => {
  it("should decode common HTML entities", () => {
    expect(decodeEntities("Hello &amp; world")).toBe("Hello & world");
    expect(decodeEntities("It&#8217;s a test")).toBe("It’s a test");
    expect(decodeEntities("Double &quot;quotes&quot;")).toBe('Double "quotes"');
  });

  it("should handle empty or null input", () => {
    expect(decodeEntities("")).toBe("");
    expect(decodeEntities(undefined)).toBe("");
    expect(decodeEntities(null)).toBe("");
  });

  it("should handle strings without entities", () => {
    expect(decodeEntities("Just a normal string")).toBe("Just a normal string");
  });

  it("should decode complex and nested HTML-like strings", () => {
    expect(decodeEntities("&lt;b&gt;bold&lt;/b&gt;")).toBe("<b>bold</b>");
    expect(decodeEntities("Some &lt;script&gt;alert(1)&lt;/script&gt; code")).toBe(
      "Some <script>alert(1)</script> code",
    );
  });

  it("should not recurse (as decided)", () => {
    // If it was recursive, this would become "&"
    // Since it's not, it should stay "&amp;"
    expect(decodeEntities("&amp;amp;")).toBe("&amp;");
  });
});

describe("cleanText", () => {
  it("should trim whitespace", () => {
    expect(cleanText("  hello world  ")).toBe("hello world");
  });

  it("should normalize multiple spaces", () => {
    expect(cleanText("hello    world")).toBe("hello world");
  });

  it("should normalize line breaks", () => {
    expect(cleanText("line1\r\nline2\rline3")).toBe("line1\nline2\nline3");
  });

  it("should handle empty or null input", () => {
    expect(cleanText("")).toBe("");
    expect(cleanText(undefined)).toBe("");
    expect(cleanText(null)).toBe("");
  });
});

describe("normalizeDate", () => {
  const mockNow = new Date("2024-01-01T00:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should parse valid ISO 8601 dates", () => {
    const dateStr = "2023-12-25T12:00:00Z";
    expect(normalizeDate(dateStr).toISOString()).toBe(
      "2023-12-25T12:00:00.000Z",
    );
  });

  it("should parse valid RFC 822 dates", () => {
    const dateStr = "Mon, 25 Dec 2023 12:00:00 GMT";
    expect(normalizeDate(dateStr).toISOString()).toBe(
      "2023-12-25T12:00:00.000Z",
    );
  });

  it("should parse non-standard formats", () => {
    expect(normalizeDate("2023-12-25 12:00:00").getTime()).toBeGreaterThan(0);
    expect(normalizeDate("2023-12-25").getTime()).toBeGreaterThan(0);
  });

  it("should fallback to now for invalid dates", () => {
    expect(normalizeDate("invalid-date").toISOString()).toBe(
      mockNow.toISOString(),
    );
  });

  it("should fallback to now for missing input", () => {
    expect(normalizeDate(undefined).toISOString()).toBe(mockNow.toISOString());
    expect(normalizeDate(null).toISOString()).toBe(mockNow.toISOString());
    expect(normalizeDate("").toISOString()).toBe(mockNow.toISOString());
  });
});

describe("normalizeUrl", () => {
  it("should return absolute URL as is (but trimmed)", () => {
    expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com/");
  });

  it("should resolve relative URLs with a base", () => {
    expect(normalizeUrl("/path/to/item", "https://example.com")).toBe(
      "https://example.com/path/to/item",
    );
    expect(normalizeUrl("item.html", "https://example.com/blog/")).toBe(
      "https://example.com/blog/item.html",
    );
  });

  it("should handle relative URL without a base by returning trimmed", () => {
    expect(normalizeUrl("/path/to/item")).toBe("/path/to/item");
  });

  it("should handle invalid URLs", () => {
    expect(normalizeUrl("not-a-url")).toBe("not-a-url");
  });

  it("should return undefined for missing input", () => {
    expect(normalizeUrl(undefined)).toBeUndefined();
    expect(normalizeUrl(null)).toBeUndefined();
    expect(normalizeUrl("  ")).toBeUndefined();
  });
});
