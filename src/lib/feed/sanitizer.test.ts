import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitizer";

describe("sanitizeHtml", () => {
  it("should strip dangerous tags", () => {
    const malicious =
      '<script>alert("xss")</script><p>Safe content</p><form><input type="text"></form>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized.trim()).toBe("<p>Safe content</p>");
  });

  it("should strip dangerous attributes", () => {
    const malicious =
      '<img src="x" onerror="alert(1)"> <a href="javascript:alert(1)">Link</a>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized.trim()).toBe('<img src="x" /> <a target="_blank" rel="noopener noreferrer">Link</a>');
  });

  it("should strip visually empty tags", () => {
    const html = '<p>Content</p><p>&nbsp;</p><h3>   </h3><p><br></p>';
    const sanitized = sanitizeHtml(html);
    // p with content and p with br should stay, others should go
    expect(sanitized).toContain('<p>Content</p>');
    expect(sanitized).toContain('<p><br /></p>');
    expect(sanitized).not.toContain('<p> </p>');
    expect(sanitized).not.toContain('<h3>');
  });

  it("should allow safe tags and attributes", () => {
    const safe =
      '<h1 title="title">Header</h1><p>Paragraph with <strong>strong</strong> and <em>em</em>.</p><ul><li>Item</li></ul>';
    const sanitized = sanitizeHtml(safe);
    expect(sanitized.trim()).toBe(safe);
  });

  it("should allow layout and table tags", () => {
    const html =
      '<div><figure><figcaption>Caption</figcaption><table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table></figure></div>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).toContain("<table>");
    expect(sanitized).toContain("<tr>");
    expect(sanitized).toContain("<td>");
    expect(sanitized).toContain("<figure>");
    expect(sanitized).toContain("<div>");
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
    expect(sanitized.trim()).toBe("");
  });

  it("should ensure all links open in new tab with security attributes", () => {
    const html = '<a href="https://google.com">Google</a>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).toContain('target="_blank"');
    expect(sanitized).toContain('rel="noopener noreferrer"');
  });

  it("should NOT convert Markdown to HTML", () => {
    const markdown = "This is **bold** text";
    const sanitized = sanitizeHtml(markdown);
    // Should NOT contain <strong> because marked was removed
    expect(sanitized).not.toContain("<strong>");
    // Should be wrapped in p by DOMPurify because it's treated as text
    expect(sanitized).toContain("This is **bold** text");
  });

  it("should handle empty or null input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(null)).toBe("");
  });

  describe("relative URL resolution", () => {
    const baseUrl = "https://example.com/blog/";

    it("should resolve relative links (href)", () => {
      const html = '<a href="/about">About</a>';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('href="https://example.com/about"');
    });

    it("should resolve relative images (src)", () => {
      const html = '<img src="../images/photo.jpg">';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('src="https://example.com/images/photo.jpg"');
    });

    it("should not modify absolute URLs", () => {
      const html = '<a href="https://other.com">External</a>';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('href="https://other.com"');
    });

    it("should not modify protocol-relative URLs", () => {
      const html = '<img src="//cdn.com/img.png">';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('src="//cdn.com/img.png"');
    });

    it("should not modify mailto or tel links", () => {
      const html = '<a href="mailto:test@example.com">Email</a>';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('href="mailto:test@example.com"');
    });

    it("should not modify anchors (#)", () => {
      const html = '<a href="#top">Top</a>';
      const sanitized = sanitizeHtml(html, baseUrl);
      expect(sanitized).toContain('href="#top"');
    });
  });
});
