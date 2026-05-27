import { describe, expect, it } from "vitest";
import { highlightCodeBlocks } from "./syntax";

describe("highlightCodeBlocks", () => {
  it("strips existing spans/highlighting before processing", () => {
    const html =
      '<pre><code><span class="old">function</span> test() { return true; }</code></pre>';
    const result = highlightCodeBlocks(html);

    expect(result).not.toContain('class="old"');
    expect(result).toContain('class="hljs-keyword"');
  });

  it("ignores code blocks that are not inside pre tags", () => {
    const html = "<p>Inline <code>const x = 1;</code> code</p>";
    const result = highlightCodeBlocks(html);

    expect(result).not.toContain('class="hljs"');
    expect(result).toBe(html);
  });

  it("handles non-code text gracefully", () => {
    const html =
      "<pre><code>Just some random sentences that are not code at all.</code></pre>";
    const result = highlightCodeBlocks(html);
    // It should still have the hljs class for theme consistency
    expect(result).toContain('class="hljs"');
    // Content should be preserved
    expect(result).toContain("Just some random sentences");
  });

  it("handles empty or missing input", () => {
    expect(highlightCodeBlocks("")).toBe("");
    // @ts-expect-error
    expect(highlightCodeBlocks(null)).toBe(null);
  });
});
