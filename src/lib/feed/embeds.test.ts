import { describe, expect, it } from "vitest";
import { transformEmbeds } from "./embeds";

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
});
