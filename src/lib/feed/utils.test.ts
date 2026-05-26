import { describe, expect, it } from "vitest";
import { isExcerpt } from "./utils";

describe("isExcerpt", () => {
  it("returns true if content is missing", () => {
    expect(isExcerpt({ description: "Teaser" })).toBe(true);
  });

  it("returns true if content is identical to description", () => {
    expect(
      isExcerpt({ content: "Full content", description: "Full content" }),
    ).toBe(true);
  });

  it("returns false for long content (> 3000 chars) regardless of patterns", () => {
    const longContent = `${"A".repeat(3001)} Read full article`;
    expect(isExcerpt({ content: longContent })).toBe(false);
  });

  it("returns true for very short content (< 200 chars)", () => {
    expect(isExcerpt({ content: "Just a small sentence." })).toBe(true);
  });

  it("detects truncation patterns in the tail", () => {
    const content = `This is a teaser. ${"B".repeat(500)} Read more...`;
    expect(isExcerpt({ content })).toBe(true);

    const content2 = `Another teaser. ${"C".repeat(500)} View the full article`;
    expect(isExcerpt({ content: content2 })).toBe(true);
  });

  it("ignores truncation patterns in the middle of long content", () => {
    const content = `A long article about full post-quantum security. ${"D".repeat(1000)}`;
    expect(isExcerpt({ content })).toBe(false);
  });

  it("handles short-form blogs (Simon Willison style) correctly", () => {
    // Short content (424 chars) but significantly larger than description (100)
    const content = "E".repeat(424);
    const description = "E".repeat(100);
    expect(isExcerpt({ content, description })).toBe(false);
  });

  it("detects suspiciously close description sizes", () => {
    // 600 chars content, 550 chars description -> likely an excerpt
    const content = "F".repeat(600);
    const description = "F".repeat(550);
    expect(isExcerpt({ content, description })).toBe(true);
  });
});
