import { describe, expect, it } from "vitest";
import {
  enhanceHtmlContent,
  highlightCodeBlocks,
  transformEmbeds,
} from "./content-transformers";

describe("enhanceHtmlContent", () => {
  it("transforms both video embeds AND code syntax blocks in a single pass", () => {
    const html = `
      <p>Watch this video: https://youtu.be/dQw4w9WgXcQ</p>
      <pre><code>function test() { return 42; }</code></pre>
    `;

    const enhanced = enhanceHtmlContent(html);

    // Verify video embed iframe
    expect(enhanced).toContain(
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"',
    );
    expect(enhanced).toContain("Watch on YouTube");

    // Verify code syntax highlighting
    expect(enhanced).toContain('class="hljs"');
    expect(enhanced).toContain('class="hljs-keyword"');
  });

  it("returns unchanged text when neither video nor code blocks exist", () => {
    const html = "<p>Just plain text content</p>";
    expect(enhanceHtmlContent(html)).toBe(html);
  });

  it("handles empty or null input gracefully", () => {
    expect(enhanceHtmlContent("")).toBe("");
    expect(enhanceHtmlContent(null)).toBe("");
    expect(enhanceHtmlContent(undefined)).toBe("");
  });
});

describe("transformEmbeds", () => {
  it("transforms a naked YouTube URL", () => {
    const html =
      "<p>Check this: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>";
    const transformed = transformEmbeds(html);
    expect(transformed).toContain(
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"',
    );
    expect(transformed).toContain(
      '<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Watch on YouTube</a>',
    );
  });

  it("transforms a short youtu.be URL", () => {
    const html = "<div>https://youtu.be/dQw4w9WgXcQ</div>";
    const transformed = transformEmbeds(html);
    expect(transformed).toContain(
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"',
    );
  });

  it("transforms a Vimeo URL", () => {
    const html = "<div>https://vimeo.com/123456789</div>";
    const transformed = transformEmbeds(html);
    expect(transformed).toContain(
      '<iframe src="https://player.vimeo.com/video/123456789"',
    );
    expect(transformed).toContain("Watch on Vimeo");
  });

  it("ignores URLs inside <a> tags", () => {
    const html =
      '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Link</a></p>';
    const transformed = transformEmbeds(html);
    expect(transformed).not.toContain("<iframe");
    expect(transformed).toBe(html);
  });

  it("ignores URLs inside <code> blocks", () => {
    const html =
      "<p><code>https://www.youtube.com/watch?v=dQw4w9WgXcQ</code></p>";
    const transformed = transformEmbeds(html);
    expect(transformed).not.toContain("<iframe");
    expect(transformed).toBe(html);
  });

  it("ignores URLs inside <pre> blocks", () => {
    const html = "<pre>https://www.youtube.com/watch?v=dQw4w9WgXcQ</pre>";
    const transformed = transformEmbeds(html);
    expect(transformed).not.toContain("<iframe");
    expect(transformed).toBe(html);
  });

  it("handles multiple URLs", () => {
    const html =
      "<p>Video 1: https://youtu.be/dQw4w9WgXcQ, Video 2: https://youtu.be/ok-aNnc0Dko</p>";
    const transformed = transformEmbeds(html);
    const iframes = transformed.match(/<iframe/g);
    expect(iframes?.length).toBe(2);
  });

  it("handles empty or null input", () => {
    expect(transformEmbeds("")).toBe("");
    // @ts-expect-error
    expect(transformEmbeds(null)).toBe(null);
  });

  it("handles HTML without video URLs", () => {
    const html = "<p>Just some text with <a href='/'>a link</a>.</p>";
    const transformed = transformEmbeds(html);
    expect(transformed).toBe(html);
  });

  it("handles malformed video URLs gracefully", () => {
    const html = `
      <p>Bad YT: https://www.youtube.com/watch?v=short</p>
      <p>Bad Vimeo: https://vimeo.com/not-a-number</p>
    `;
    const transformed = transformEmbeds(html);
    expect(transformed).not.toContain("<iframe");
    expect(transformed).toContain("https://www.youtube.com/watch?v=short");
    expect(transformed).toContain("https://vimeo.com/not-a-number");
  });
});

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
