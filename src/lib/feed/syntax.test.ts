import { describe, expect, it } from "vitest";
import { highlightCodeBlocks } from "./syntax";

describe("highlightCodeBlocks", () => {
  it("highlights basic javascript code", () => {
    const html =
      '<pre><code>function hello() { console.log("world"); return 123; }</code></pre>';
    const result = highlightCodeBlocks(html);

    expect(result).toContain('class="hljs-keyword"');
    expect(result).toContain('class="hljs"');
    // hljs might detect it as javascript or typescript, both are fine
    expect(result).toMatch(/data-language="(javascript|typescript)"/);
  });

  it("handles HTML entities inside code blocks correctly", () => {
    const html =
      '<pre><code>&lt;div class="test"&gt;Hello&lt;/div&gt;</code></pre>';
    const result = highlightCodeBlocks(html);

    expect(result).toContain('class="hljs-tag"');
    expect(result).toContain("div");
    expect(result).toContain('class="hljs-attr"');
  });

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

  it("handles multiple code blocks", () => {
    const html = `
      <pre><code>function js() { return "js"; }</code></pre>
      <pre><code>import math\ndef py_test(x):\n    return math.sqrt(x)</code></pre>
    `;
    const result = highlightCodeBlocks(html);

    expect(result).toMatch(/data-language="(javascript|typescript)"/);
    expect(result).toContain('data-language="python"');
  });

  it("handles non-code text gracefully", () => {
    const html =
      "<pre><code>Just some random sentences that are not code at all.</code></pre>";
    const result = highlightCodeBlocks(html);
    // It should still have the hljs class for theme consistency
    expect(result).toContain('class="hljs"');
    // Content should be preserved (though potentially wrapped in spans if it guessed a language)
    expect(result).toContain("Just some random sentences");
  });

  it("handles empty or missing input", () => {
    expect(highlightCodeBlocks("")).toBe("");
    // @ts-expect-error
    expect(highlightCodeBlocks(null)).toBe(null);
  });
});
