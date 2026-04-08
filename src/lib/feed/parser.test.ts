import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FeedInvalidFormatError } from "@/lib/errors";
import { parseFeedXml } from "./parser";

describe("parseFeedXml", () => {
  const fixturesPath = path.join(process.cwd(), "e2e/fixtures");

  it("correctly parses RSS 2.0 feed", async () => {
    const xml = fs.readFileSync(path.join(fixturesPath, "rss-2.xml"), "utf-8");
    const result = await parseFeedXml(xml);

    expect(result.metadata.title).toBe("Standard RSS 2.0 Feed");
    expect(result.metadata.description).toBe(
      "Tips, Tricks, and Techniques on using Cascading Style Sheets.",
    );
    expect(result.metadata.link).toBe("https://css-tricks.com");
    expect(result.items.length).toBe(5);

    const firstItem = result.items[0];
    expect(firstItem.title).toBe("Making Complex CSS Shapes Using shape()");
    expect(firstItem.url).toBe(
      "https://css-tricks.com/complex-css-shapes-with-shape-function/",
    );
    expect(firstItem.publishedAt).toBeInstanceOf(Date);
    expect(firstItem.guid).toBe("https://css-tricks.com/?p=392986");
    expect(firstItem.description).toContain("Creating rectangles");
    expect(firstItem.content).toContain("Creating rectangles"); // content:encoded
  });

  it("correctly parses Atom 1.0 feed", async () => {
    const xml = fs.readFileSync(path.join(fixturesPath, "atom-1.xml"), "utf-8");
    const result = await parseFeedXml(xml);

    expect(result.metadata.title).toBe("Standard Atom 1.0 Feed");
    expect(result.items.length).toBeGreaterThan(0);

    const firstItem = result.items[0];
    expect(firstItem.title).toBe("Optimizing Vercel Sandbox snapshots");
    expect(firstItem.url).toBe(
      "https://vercel.com/blog/optimizing-vercel-sandbox-snapshots",
    );
    expect(firstItem.publishedAt).toBeInstanceOf(Date);
    expect(firstItem.guid).toBe(
      "https://vercel.com/blog/optimizing-vercel-sandbox-snapshots",
    );

    // rss-parser maps Atom authors differently. Let's verify what we get.
    // If multiple authors, it's usually in authors. For now let's just see if creator is populated.
    // In our parser.ts we use item.creator.
    expect(firstItem.author).toBeDefined();
    expect(firstItem.author).toBe("Tom Lienard");
  });

  it("correctly parses RSS 1.0 (RDF) feed", async () => {
    const rss1Xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/">
        <channel rdf:about="http://www.xml.com/xml/news.rss">
          <title>XML.com</title>
          <link>http://www.xml.com/</link>
          <description>XML.com features a rich mix of information and services for the XML community.</description>
          <items>
            <rdf:seq>
              <rdf:li rdf:resource="http://www.xml.com/pub/2000/08/09/xslt/xslt.html"/>
            </rdf:seq>
          </items>
        </channel>
        <item rdf:about="http://www.xml.com/pub/2000/08/09/xslt/xslt.html">
          <title>Processing Inclusions with XSLT</title>
          <link>http://www.xml.com/pub/2000/08/09/xslt/xslt.html</link>
          <description>XSLT is often used to process XML documents.</description>
        </item>
      </rdf:RDF>
    `;
    const result = await parseFeedXml(rss1Xml);

    expect(result.metadata.title).toBe("XML.com");
    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe("Processing Inclusions with XSLT");
  });

  it("decodes HTML entities in titles and descriptions", async () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <title>Test &amp; Feed</title>
          <item>
            <title>Title &apos;with&apos; entities &amp; stuff</title>
            <description>Description &lt;b&gt;with&lt;/b&gt; tags and &amp; entities</description>
            <link>http://example.com/1</link>
          </item>
        </channel>
      </rss>
    `;
    const result = await parseFeedXml(xml);

    expect(result.metadata.title).toBe("Test & Feed");
    expect(result.items[0].title).toBe("Title 'with' entities & stuff");
    // decodeEntities is used on contentSnippet or summary.
    // rss-parser might strip tags for contentSnippet.
    expect(result.items[0].description).toContain("Description");
    expect(result.items[0].description).toContain("with tags and & entities");
  });

  it("generates a deterministic GUID if missing", async () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <item>
            <title>Item without GUID</title>
            <link>http://example.com/no-guid</link>
            <description>Test</description>
          </item>
        </channel>
      </rss>
    `;
    const result = await parseFeedXml(xml);
    const item = result.items[0];

    expect(item.guid).toBeDefined();
    expect(item.guid.length).toBe(64); // SHA-256 hash length in hex

    // Re-parsing should yield the same GUID
    const result2 = await parseFeedXml(xml);
    expect(result2.items[0].guid).toBe(item.guid);
  });

  it("throws FeedInvalidFormatError for invalid XML", async () => {
    const invalidXml = "not really xml";
    await expect(parseFeedXml(invalidXml)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });
});
