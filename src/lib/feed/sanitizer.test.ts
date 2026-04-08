import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitizer";

describe("sanitizeHtml", () => {
  it("should strip dangerous tags", () => {
    const malicious =
      '<script>alert("xss")</script><p>Safe content</p><form><input type="text"></form>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).toBe("<p>Safe content</p>");
  });

  it("should strip dangerous attributes", () => {
    const malicious =
      '<img src="x" onerror="alert(1)"> <a href="javascript:alert(1)">Link</a>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).toBe('<img src="x"> <a>Link</a>');
  });

  it("should allow safe tags and attributes", () => {
    const safe =
      '<h1 title="title">Header</h1><p>Paragraph with <strong>strong</strong> and <em>em</em>.</p><ul><li>Item</li></ul>';
    const sanitized = sanitizeHtml(safe);
    expect(sanitized).toBe(safe);
  });

  it("should handle allowed video embeds", () => {
    const youtube =
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" allowfullscreen></iframe>';
    const vimeo =
      '<iframe src="https://player.vimeo.com/video/123456" frameborder="0"></iframe>';

    expect(sanitizeHtml(youtube)).toContain(
      'src="https://www.youtube.com/embed/dQw4w9WgXcQ"',
    );
    expect(sanitizeHtml(vimeo)).toContain(
      'src="https://player.vimeo.com/video/123456"',
    );
  });

  it("should strip malicious iframes", () => {
    const malicious = '<iframe src="https://evil.com/malware"></iframe>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).toBe("");
  });

  it("should handle empty or null input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(null)).toBe("");
  });
});
