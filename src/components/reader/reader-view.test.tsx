import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createMockFeedItemWithSource } from "@/tests/factories";
import { server } from "@/tests/mocks/server";
import { render, screen, waitFor } from "@/tests/rtl-utils";
import { FeedReaderSheet } from "./feed-reader-sheet";
import { ReaderView } from "./reader-view";

describe("ReaderView", () => {
  it("renders basic metadata and title", () => {
    const data = createMockFeedItemWithSource({
      item: { title: "Test Article Title" },
      feed: { title: "Test Feed Name" },
    });
    render(<ReaderView data={data} />);

    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("Test Feed Name")).toBeInTheDocument();
    expect(screen.getByText(/View original/i)).toBeInTheDocument();
  });

  it("renders HTML content", () => {
    const data = createMockFeedItemWithSource({
      item: {
        content: `
          <p>Paragraph 1</p>
          <blockquote>Blockquote content</blockquote>
          <a href="https://example.com">Link</a>
        `,
      },
    });
    render(<ReaderView data={data} />);

    expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
    expect(screen.getByText("Blockquote content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Link/i })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});

describe("FeedReaderSheet", () => {
  it("displays loading skeleton when loading", async () => {
    const mockData = createMockFeedItemWithSource({ item: { id: 123 } });

    server.use(
      http.get("/api/feeds/items/123", async () => {
        // Delay to ensure loading state is visible if we were able to catch it,
        // but here we just want to ensure it shows something other than the data initially.
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(mockData);
      }),
    );

    render(<FeedReaderSheet />, { searchParams: { itemId: "123" } });

    // The skeleton is rendered when loading
    // We can check for the accessibility title of the sheet which is always there
    expect(screen.getByText("Article Reader")).toBeInTheDocument();

    // Data should not be there yet
    expect(screen.queryByText(mockData.item.title!)).not.toBeInTheDocument();
  });

  it("displays error message on 404", async () => {
    server.use(
      http.get("/api/feeds/items/123", () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    render(<FeedReaderSheet />, { searchParams: { itemId: "123" } });

    await waitFor(() => {
      expect(screen.getByText("Article not found")).toBeInTheDocument();
    });
  });

  it("displays error message on 500", async () => {
    server.use(
      http.get("/api/feeds/items/123", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<FeedReaderSheet />, { searchParams: { itemId: "123" } });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch article content"),
      ).toBeInTheDocument();
    });
  });

  it("renders ReaderView when data is loaded", async () => {
    const mockData = createMockFeedItemWithSource({
      item: { id: 123, title: "Loaded Article" },
    });

    server.use(
      http.get("/api/feeds/items/123", () => {
        return HttpResponse.json(mockData);
      }),
    );

    render(<FeedReaderSheet />, { searchParams: { itemId: "123" } });

    await waitFor(() => {
      expect(screen.getByText("Loaded Article")).toBeInTheDocument();
    });
  });
});
