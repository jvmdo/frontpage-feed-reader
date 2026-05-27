import { describe, expect, it } from "vitest";
import { processItem } from "./processor";

describe("processItem", () => {
  const sourceUrl = "https://example.com/feed.xml";

  it("processes basic item correctly", async () => {
    const raw = {
      title: "Test Item",
      link: "https://example.com/item",
      content: "<p>Hello</p>",
      pubDate: "2024-01-01T12:00:00Z",
    };

    const result = await processItem(raw, sourceUrl);

    expect(result.title).toBe("Test Item");
    expect(result.url).toBe("https://example.com/item");
    expect(result.content).toBe("<p>Hello</p>");
    expect(result.description).toBe("Hello");
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it("resolves relative links in content using sourceUrl", async () => {
    const raw = {
      title: "Relative Link",
      link: "item",
      content: '<a href="/full-article">Read more</a>',
    };

    const result = await processItem(raw, sourceUrl);

    expect(result.url).toBe("https://example.com/item");
    expect(result.content).toContain('href="https://example.com/full-article"');
  });

  it("prefers feedLink over sourceUrl for resolution", async () => {
    const feedLink = "https://canonical.com/";
    const raw = {
      title: "Canonical Link",
      content: '<a href="/about">About</a>',
    };

    const result = await processItem(raw, sourceUrl, feedLink);

    expect(result.content).toContain('href="https://canonical.com/about"');
  });

  it("strips tags for title and description", async () => {
    const raw = {
      title: "Title <b>bold</b>",
      content: "<i>Content</i>",
    };

    const result = await processItem(raw, sourceUrl);

    expect(result.title).toBe("Title bold");
    expect(result.description).toBe("Content");
    expect(result.content).toBe("<i>Content</i>");
  });

  it("handles messy templates with commas", async () => {
    const raw = {
      title: "Test",
      content: "<p>manage , , , , and more</p>",
    };

    const result = await processItem(raw, sourceUrl);
    expect(result.description).toBe("manage, and more");
  });

  it("extracts text from tables without sticking words together", async () => {
    const raw = {
      title: "Table Test",
      content: "<table><tr><td>Cell1</td><td>Cell2</td></tr></table>",
    };

    const result = await processItem(raw, sourceUrl);
    // Should have a space between Cell1 and Cell2
    expect(result.description).toBe("Cell1 Cell2");
    expect(result.textContent).toBe("Cell1 Cell2");
  });

  it("auto-embeds YouTube URLs in content", async () => {
    const raw = {
      title: "Video Test",
      content: "<p>Watch this: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>",
    };

    const result = await processItem(raw, sourceUrl);
    expect(result.content).toContain("<iframe");
    expect(result.content).toContain(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("applies syntax highlighting in the full pipeline", async () => {
    const raw = {
      title: "Syntax Test",
      content: '<pre><code>function pipeline() { return "ok"; }</code></pre>',
    };

    const result = await processItem(raw, sourceUrl);
    expect(result.content).toContain('class="hljs"');
    expect(result).toMatchObject({
      title: "Syntax Test",
    });
  });

  it("caps description at 500 characters", async () => {
    const raw = {
      title: "Long Description",
      content: "A".repeat(1000),
    };

    const result = await processItem(raw, sourceUrl);
    expect(result.description.length).toBe(500);
  });

  it("generates a deterministic GUID if missing from raw payload", async () => {
    const raw = {
      title: "Item without GUID",
      link: "https://example.com/no-guid",
    };

    const result1 = await processItem(raw, sourceUrl);
    const result2 = await processItem(raw, sourceUrl);

    expect(result1.guid).toBeDefined();
    expect(result1.guid.length).toBe(64); // SHA-256 hex
    expect(result1.guid).toBe(result2.guid);
  });

  it("uses content as fallback for description and cleans it", async () => {
    const raw = {
      title: "No Description",
      content: "<p>This is the <b>content</b> used as fallback.</p>",
    };

    const result = await processItem(raw, sourceUrl);
    expect(result.description).toBe("This is the content used as fallback.");
  });
});
