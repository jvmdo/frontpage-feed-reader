import { describe, expect, it } from "vitest";
import { extractText } from "./extractor";

describe("extractText", () => {
  it("strips basic HTML tags", () => {
    const input = "<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p>";
    const output = extractText(input);
    expect(output).toBe("Title Paragraph with bold text.");
  });

  it("adds spaces between block elements", () => {
    const input = "<div>First</div><div>Second</div><p>Third</p>";
    const output = extractText(input);
    expect(output).toBe("First Second Third");
  });

  it("handles double-encoded HTML tags", () => {
    const input = "&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;World&lt;/p&gt;";
    const output = extractText(input);
    expect(output).toBe("Hello World");
  });

  it("handles messy triple-encoded/mixed encoding", () => {
    const input = "&amp;lt;p&amp;gt; Messy &amp;lt;/p&amp;gt;";
    const output = extractText(input);
    expect(output).toBe("Messy");
  });

  it("skips scripts, styles, and iframes", () => {
    const input = `
      <style>.foo { color: red; }</style>
      <script>console.log('hi')</script>
      <p>Visible content</p>
      <iframe>Hidden</iframe>
    `;
    const output = extractText(input);
    expect(output).toBe("Visible content");
  });

  it("ignores hrefs in links", () => {
    const input = '<a href="https://google.com">Search</a>';
    const output = extractText(input);
    expect(output).toBe("Search");
  });

  it("collapses multiple whitespaces", () => {
    const input = "<p>Word \n\n  Another     Word</p>";
    const output = extractText(input);
    expect(output).toBe("Word Another Word");
  });

  it("returns empty string for null/undefined", () => {
    expect(extractText(null)).toBe("");
    expect(extractText(undefined)).toBe("");
  });

  it("handles plain text correctly", () => {
    const input = "Just plain text without tags.";
    expect(extractText(input)).toBe("Just plain text without tags.");
  });
});
