import { describe, expect, it } from "vitest";
import { processItem } from "./processor";

describe("processItem", () => {
  const sourceUrl = "https://example.com/feed.xml";

  it("processes basic item correctly", () => {
    const raw = {
      title: "Test Item",
      link: "https://example.com/item",
      content: "<p>Hello</p>",
      pubDate: "2024-01-01T12:00:00Z",
    };

    const result = processItem(raw, sourceUrl);

    expect(result.title).toBe("Test Item");
    expect(result.url).toBe("https://example.com/item");
    expect(result.content).toBe("<p>Hello</p>");
    expect(result.description).toBe("Hello");
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it("resolves relative links in content using sourceUrl", () => {
    const raw = {
      title: "Relative Link",
      link: "item",
      content: '<a href="/full-article">Read more</a>',
    };

    const result = processItem(raw, sourceUrl);

    expect(result.url).toBe("https://example.com/item");
    expect(result.content).toContain('href="https://example.com/full-article"');
  });

  it("prefers feedLink over sourceUrl for resolution", () => {
    const feedLink = "https://canonical.com/";
    const raw = {
      title: "Canonical Link",
      content: '<a href="/about">About</a>',
    };

    const result = processItem(raw, sourceUrl, feedLink);

    expect(result.content).toContain('href="https://canonical.com/about"');
  });

  it("strips tags for title and description", () => {
    const raw = {
      title: "Title <b>bold</b>",
      content: "<i>Content</i>",
    };

    const result = processItem(raw, sourceUrl);

    expect(result.title).toBe("Title bold");
    expect(result.description).toBe("Content");
    expect(result.content).toBe("<i>Content</i>");
  });

  it("handles messy templates with commas", () => {
    const raw = {
      title: "Test",
      content: "<p>manage , , , , and more</p>",
    };

    const result = processItem(raw, sourceUrl);
    expect(result.description).toBe("manage, and more");
  });

  it("extracts text from tables without sticking words together", () => {
    const raw = {
      title: "Table Test",
      content: "<table><tr><td>Cell1</td><td>Cell2</td></tr></table>",
    };

    const result = processItem(raw, sourceUrl);
    // Should have a space between Cell1 and Cell2
    expect(result.description).toBe("Cell1 Cell2");
    expect(result.textContent).toBe("Cell1 Cell2");
  });

  it("auto-embeds YouTube URLs in content", () => {
    const raw = {
      title: "Video Test",
      content: "<p>Watch this: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>",
    };

    const result = processItem(raw, sourceUrl);
    expect(result.content).toContain("<iframe");
    expect(result.content).toContain(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("applies syntax highlighting in the full pipeline", () => {
    const raw = {
      title: "Syntax Test",
      content: '<pre><code>function pipeline() { return "ok"; }</code></pre>',
    };

    const result = processItem(raw, sourceUrl);
    expect(result.content).toContain('class="hljs"');
    expect(result).toMatchObject({
      title: "Syntax Test",
    });
  });

  it("caps description at 500 characters", () => {
    const raw = {
      title: "Long Description",
      content: "A".repeat(1000),
    };

    const result = processItem(raw, sourceUrl);
    expect(result.description.length).toBe(500);
  });
});
