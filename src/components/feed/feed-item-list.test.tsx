import { delay, HttpResponse, http } from "msw";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedItemWithSource } from "@/types";
import { FeedItemList } from "./feed-item-list";

const mockItems: FeedItemWithSource[] = [
  {
    item: {
      id: 1,
      feedId: 1,
      guid: "item-1",
      title: "Test Article 1",
      description: "Description 1",
      url: "https://example.com/1",
      content: null,
      author: "Author 1",
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
  },
];

describe("FeedItemList", () => {
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
    for (const skeleton of skeletons) {
      expect(skeleton.closest('[aria-hidden="true"]')).toBeInTheDocument();
    }
  });

  test("renders list of items when fetch is successful", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json(mockItems);
      }),
    );

    render(<FeedItemList />);

    const title = await screen.findByRole("heading", {
      name: /test article 1/i,
    });
    expect(title).toBeInTheDocument();

    expect(screen.getByText(/example feed/i)).toBeInTheDocument();
    expect(screen.getByText(/description 1/i)).toBeInTheDocument();
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
