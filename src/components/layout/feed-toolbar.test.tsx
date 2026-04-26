import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { FeedToolbar } from "./feed-toolbar";

// Mock hooks that are not covered by MSW easily or needed for simple UI checks
vi.mock("@/hooks/use-mark-all-read", () => ({
  useMarkAllRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock("@/hooks/use-refresh-feed", () => ({
  useRefreshFeed: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe("FeedToolbar", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 10, categories: {}, feeds: {} },
        });
      }),
    );
  });

  it('renders "All Items" by default', async () => {
    render(<FeedToolbar />);

    expect(await screen.findByText("All Items")).toBeInTheDocument();
    expect(screen.getByText("10 unread")).toBeInTheDocument();
  });

  it("renders the feed title when filtered by feedId", async () => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              feed: { id: 1, title: "My Tech Feed" },
              subscription: { customTitle: null },
            },
          ],
        });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 10, categories: {}, feeds: { "1": 5 } },
        });
      }),
    );

    render(<FeedToolbar />, {
      searchParams: { feedId: "1" },
    });

    expect(await screen.findByText("My Tech Feed")).toBeInTheDocument();
    expect(screen.getByText("5 unread")).toBeInTheDocument();
  });

  it("renders the custom subscription title if available", async () => {
    server.use(
      http.get("/api/feeds/subscriptions", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              feed: { id: 1, title: "Original Title" },
              subscription: { customTitle: "Custom Title" },
            },
          ],
        });
      }),
    );

    render(<FeedToolbar />, {
      searchParams: { feedId: "1" },
    });

    expect(await screen.findByText("Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("Original Title")).not.toBeInTheDocument();
  });

  it("renders the category name when filtered by categoryId", async () => {
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 10, name: "Technology" }],
        });
      }),
      http.get("/api/feeds/unread-counts", () => {
        return HttpResponse.json({
          success: true,
          data: { global: 10, categories: { "10": 3 }, feeds: {} },
        });
      }),
    );

    render(<FeedToolbar />, {
      searchParams: { categoryId: "10" },
    });

    expect(await screen.findByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("3 unread")).toBeInTheDocument();
  });

  it("renders the new items banner placeholder", async () => {
    render(<FeedToolbar />);
    expect(
      await screen.findByText(/new items since your last visit/i),
    ).toBeInTheDocument();
  });

  it("renders layout toggles", async () => {
    render(<FeedToolbar />);
    expect(await screen.findByLabelText(/list view/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grid view/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rows view/i)).toBeInTheDocument();
  });
});
