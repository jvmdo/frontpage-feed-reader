import fs from "node:fs";
import path from "node:path";
import { FeedInvalidFormatError } from "@/lib/errors";
import { parseFeedXml } from "./parser";

describe("parseFeedXml", () => {
  const fixturesPath = path.join(process.cwd(), "e2e/fixtures");

  it("correctly parses RSS 2.0 feed", async () => {
    const xml = fs.readFileSync(path.join(fixturesPath, "rss-2.xml"), "utf-8");
    const result = await parseFeedXml(xml, "https://css-tricks.com/feed/");

    expect(result.metadata.title).toBe("Standard RSS 2.0 Feed");
    expect(result.metadata.description).toBe(
      "Tips, Tricks, and Techniques on using Cascading Style Sheets.",
    );
    expect(result.metadata.link).toBe("https://css-tricks.com/");
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
    const result = await parseFeedXml(xml, "https://vercel.com/blog/feed");

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

  it("extracts metadata without processing items when metadataOnly: true", async () => {
    const xml = fs.readFileSync(path.join(fixturesPath, "rss-2.xml"), "utf-8");
    const result = await parseFeedXml(xml, "https://css-tricks.com/feed/", {
      metadataOnly: true,
    });

    expect(result.metadata.title).toBe("Standard RSS 2.0 Feed");
    expect(result.metadata.description).toBe(
      "Tips, Tricks, and Techniques on using Cascading Style Sheets.",
    );
    expect(result.metadata.link).toBe("https://css-tricks.com/");
    expect(result.items).toEqual([]);
  });

  it("resolves relative feed image URL against feed link or source URL", async () => {
    const xmlWithRelativeImage = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Sidebar Feed</title>
          <link>https://sidebar.io</link>
          <description>Web design articles</description>
          <image>
            <url>img/favicon.png</url>
            <title>Sidebar</title>
            <link>https://sidebar.io</link>
          </image>
        </channel>
      </rss>
    `;

    const result = await parseFeedXml(xmlWithRelativeImage);

    expect(result.metadata.iconUrl).toBe("https://sidebar.io/img/favicon.png");
  });

  it("throws FeedInvalidFormatError for invalid XML", async () => {
    const invalidXml = "not really xml";
    await expect(parseFeedXml(invalidXml)).rejects.toThrow(
      FeedInvalidFormatError,
    );
  });
});
