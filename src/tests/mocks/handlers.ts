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

  // Mock Google Favicon service HEAD requests (for server-side validation)
  http.head("https://www.google.com/s2/favicons", () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Mock Google Favicon service GET requests
  http.get("https://www.google.com/s2/favicons", () => {
    return new HttpResponse(new Uint8Array([]), {
      status: 200,
      headers: { "Content-Type": "image/x-icon" },
    });
  }),

  // Mock System Sync/Refresh Task Status endpoint
  http.get("/api/refresh-task-status", () => {
    return HttpResponse.json({
      success: true,
      data: {
        active: true,
        isFailing: false,
        lastRunAt: "2026-07-08T22:00:00.000Z",
        nextRunAt: "2026-07-08T22:15:00.000Z",
      },
    });
  }),
];
