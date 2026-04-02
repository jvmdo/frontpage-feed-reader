import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("https://example.com/feed.xml", () => {
    return HttpResponse.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Example Feed</title>
          <link>https://example.com</link>
          <description>A test RSS feed</description>
          <item>
            <title>Test Item 1</title>
            <link>https://example.com/item1</link>
            <description>Description 1</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            <guid>item1</guid>
          </item>
        </channel>
      </rss>
    `);
  }),
];
