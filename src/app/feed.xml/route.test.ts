import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /feed.xml", () => {
  const mockRequest = new Request("http://localhost:3000/feed.xml");

  it("returns a 200 response with XML content type", async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
  });

  it("replaces {{NOW}} placeholders with current date", async () => {
    const response = await GET(mockRequest);
    const text = await response.text();

    expect(text).not.toContain("{{NOW}}");
    // Verify it contains a valid UTC date string format (e.g., "GMT")
    expect(text).toContain("GMT");
  });

  it("replaces localhost with the actual request origin", async () => {
    const prodRequest = new Request("https://frontpage.app/feed.xml");
    const response = await GET(prodRequest);
    const text = await response.text();

    expect(text).toContain("<url>https://frontpage.app/feed-icon.svg</url>");
    expect(text).toContain(
      '<atom:link href="https://frontpage.app/feed.xml" rel="self" type="application/rss+xml" />',
    );
  });

  it("includes the correct feed metadata", async () => {
    const response = await GET(mockRequest);
    const text = await response.text();

    expect(text).toContain("<title>Frontpage</title>");
    expect(text).toContain("<guid>https://frontpage.app/welcome</guid>");
  });

  it("sets cache control headers to prevent stale feeds", async () => {
    const response = await GET(mockRequest);
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate",
    );
  });
});
