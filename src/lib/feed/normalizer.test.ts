import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanText,
  decodeEntities,
  normalizeAuthor,
  normalizeDate,
  resolveRelativeUrl,
} from "./normalizer";

describe("decodeEntities", () => {
  it("should handle empty or null input", () => {
    expect(decodeEntities("")).toBe("");
    expect(decodeEntities(undefined)).toBe("");
    expect(decodeEntities(null)).toBe("");
  });

  it("should decode complex and nested HTML-like strings", () => {
    expect(decodeEntities("&lt;b&gt;bold&lt;/b&gt;")).toBe("<b>bold</b>");
    expect(
      decodeEntities("Some &lt;script&gt;alert(1)&lt;/script&gt; code"),
    ).toBe("Some <script>alert(1)</script> code");
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

  it("should cap future dates to now", () => {
    const futureDateStr = "2024-01-02T12:00:00Z";
    expect(normalizeDate(futureDateStr).toISOString()).toBe(
      mockNow.toISOString(),
    );
  });

  it("should fallback to now for missing input", () => {
    expect(normalizeDate(undefined).toISOString()).toBe(mockNow.toISOString());
    expect(normalizeDate(null).toISOString()).toBe(mockNow.toISOString());
    expect(normalizeDate("").toISOString()).toBe(mockNow.toISOString());
  });
});

describe("resolveRelativeUrl", () => {
  it("should return absolute URL as is (but trimmed)", () => {
    expect(resolveRelativeUrl("  https://example.com  ")).toBe(
      "https://example.com/",
    );
  });

  it("should handle invalid URLs", () => {
    expect(resolveRelativeUrl("not-a-url")).toBe("not-a-url");
  });

  it("should return undefined for missing input", () => {
    expect(resolveRelativeUrl(undefined)).toBeUndefined();
    expect(resolveRelativeUrl(null)).toBeUndefined();
    expect(resolveRelativeUrl("  ")).toBeUndefined();
  });
});

describe("normalizeAuthor", () => {
  it("should handle basic names", () => {
    expect(normalizeAuthor("Jane Doe")).toBe("Jane Doe");
  });

  it("should remove 'by' prefix", () => {
    expect(normalizeAuthor("by John Smith")).toBe("John Smith");
    expect(normalizeAuthor("by, John Smith")).toBe("John Smith");
    expect(normalizeAuthor("BY John Smith")).toBe("John Smith");
  });

  it("should return undefined if only 'by' is provided", () => {
    expect(normalizeAuthor("by")).toBeUndefined();
    expect(normalizeAuthor("by,")).toBeUndefined();
    expect(normalizeAuthor("\n\t  by \t")).toBeUndefined();
  });

  it("should extract name from parentheses (Smashing style)", () => {
    expect(
      normalizeAuthor("hello@smashingmagazine.com (Vitaly Friedman)"),
    ).toBe("Vitaly Friedman");
    expect(normalizeAuthor("(Cosima Mielke)")).toBe("Cosima Mielke");
  });

  it("should convert kebab-case slugs to Title Case (MDN style)", () => {
    expect(normalizeAuthor("yash-raj-bharti")).toBe("Yash Raj Bharti");
    expect(normalizeAuthor("leo-mcardle")).toBe("Leo Mcardle");
  });

  it("should handle empty or null input", () => {
    expect(normalizeAuthor(undefined)).toBeUndefined();
    expect(normalizeAuthor(null)).toBeUndefined();
    expect(normalizeAuthor("  ")).toBeUndefined();
  });
});
