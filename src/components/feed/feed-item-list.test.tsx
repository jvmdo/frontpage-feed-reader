import { delay, HttpResponse, http } from "msw";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import { 
  setupIntersectionObserverMock, 
  triggerIntersection 
} from "@/tests/mocks/intersection-observer";
import type { FeedItemWithSource } from "@/types";
import { FeedItemList } from "./feed-item-list";

const generateMockItems = (count: number, startId = 1): FeedItemWithSource[] => {
  return Array.from({ length: count }).map((_, i) => ({
    item: {
      id: startId + i,
      feedId: 1,
      guid: `item-${startId + i}`,
      title: `Test Article ${startId + i}`,
      description: `Description ${startId + i}`,
      url: `https://example.com/${startId + i}`,
      content: null,
      author: `Author ${startId + i}`,
      publishedAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:00:00Z"),
      rawPayload: {},
      createdAt: new Date("2024-01-01T10:00:00Z"),
    },
    feed: {
      id: 1,
      url: "https://example.com/feed",
      title: "Example Feed",
      description: "A test feed",
      language: "en",
      iconUrl: "https://example.com/icon.png",
      lastFetchedAt: new Date(),
      lastSuccessAt: new Date(),
      lastFailureAt: null,
      healthStatus: "healthy",
      httpEtag: null,
      httpLastModified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }));
};

const mockItems = generateMockItems(25);

describe("FeedItemList", () => {
  beforeEach(() => {
    setupIntersectionObserverMock();
  });

  test("renders loading skeletons while fetching", async () => {
    server.use(
      http.get("/api/feeds/items", async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    render(<FeedItemList />);

    const loadingContainer = screen.getByLabelText(/loading feed items/i);

    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveAttribute("aria-busy", "true");

    // Skeletons should be present but hidden from screen readers
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');

    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("renders list of items when fetch is successful", async () => {
    server.use(
      http.get("/api/feeds/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") || "0");
        const limit = Number(url.searchParams.get("limit") || "20");

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    render(<FeedItemList />);

    const title = await screen.findByRole("heading", {
      name: /^test article 1$/i,
    });
    expect(title).toBeInTheDocument();

    expect(screen.getAllByText(/^example feed$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^description 1$/i)).toBeInTheDocument();
  });

  test("loads more items when scrolling to the bottom", async () => {
    server.use(
      http.get("/api/feeds/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") || "0");
        const limit = Number(url.searchParams.get("limit") || "20");

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    render(<FeedItemList />);

    // Wait for the first page to load
    await screen.findByRole("heading", { name: /^test article 1$/i });
    expect(screen.queryByText(/^test article 21$/i)).not.toBeInTheDocument();

    // Trigger intersection via shared utility
    triggerIntersection(true);

    // Wait for the second page to load
    await screen.findByRole("heading", { name: /^test article 21$/i });

    expect(screen.getByText(/^test article 1$/i)).toBeInTheDocument();
    expect(screen.getByText(/^test article 21$/i)).toBeInTheDocument();
  });

  test("renders empty state when no items are returned", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json([]);
      }),
    );

    render(<FeedItemList />);

    const emptyTitle = await screen.findByRole("heading", {
      name: /your feed is empty/i,
    });
    expect(emptyTitle).toBeInTheDocument();

    expect(screen.getByText(/subscribe to more feeds/i)).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<FeedItemList />);

    const errorTitle = await screen.findByRole("heading", {
      name: /something went wrong/i,
    });
    expect(errorTitle).toBeInTheDocument();

    expect(
      screen.getByText(/we couldn't load your feed items/i),
    ).toBeInTheDocument();
  });
});
