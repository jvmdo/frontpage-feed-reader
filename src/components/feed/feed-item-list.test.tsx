import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { RssIcon } from "lucide-react";
import { delay, HttpResponse, http } from "msw";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PAGINATION_LIMIT } from "@/lib/constants";
import { createMockFeedItemWithSource } from "@/tests/factories";
import {
  setupIntersectionObserverMock,
  triggerIntersection,
} from "@/tests/intersection-observer";
import { server } from "@/tests/mocks/server";
import { render, screen } from "@/tests/rtl-utils";
import type { FeedItemWithSource } from "@/types";
import { FeedItemList } from "./feed-item-list";
import FeedItemListSkeleton from "./feed-item-list-skeleton";

const generateMockItems = (
  count: number,
  startId = 1,
): FeedItemWithSource[] => {
  return Array.from({ length: count }).map((_, i) =>
    createMockFeedItemWithSource({
      item: {
        id: startId + i,
        title: `Test Article ${startId + i}`,
        description: `Description ${startId + i}`,
      },
      feed: {
        title: "Example Feed",
      },
    }),
  );
};

const mockItems = generateMockItems(PAGINATION_LIMIT * 2 + 5);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary }) => (
          <EmptyState
            title="Something went wrong"
            description="We couldn't load your feed items. Please try refreshing the page."
            icon={RssIcon}
            action={
              <Button onClick={() => resetErrorBoundary()}>Try again</Button>
            }
          />
        )}
      >
        <Suspense fallback={<FeedItemListSkeleton />}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

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

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    // FeedItemListSkeleton uses role="status"
    const loadingStatus = screen.getByRole("status");

    expect(loadingStatus).toBeInTheDocument();
    expect(loadingStatus).toHaveTextContent(/loading feed items/i);

    // Skeletons should be present but hidden from screen readers
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("renders list of items when fetch is successful", async () => {
    server.use(
      http.get("/api/feeds/items", ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get("offset") || "0");
        const limit = Number(
          url.searchParams.get("limit") || String(PAGINATION_LIMIT),
        );

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

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
        const limit = Number(
          url.searchParams.get("limit") || String(PAGINATION_LIMIT),
        );

        return HttpResponse.json(mockItems.slice(offset, offset + limit));
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const firstItemTitle = /^test article 1$/i;
    const nextItemTitle = new RegExp(
      `^test article ${PAGINATION_LIMIT + 1}$`,
      "i",
    );

    // Wait for the first page to load
    await screen.findByRole("heading", { name: firstItemTitle });
    expect(screen.queryByText(nextItemTitle)).not.toBeInTheDocument();

    // Trigger intersection via shared utility
    triggerIntersection(true);

    // Wait for the second page to load
    await screen.findByRole("heading", { name: nextItemTitle });

    expect(screen.getByText(firstItemTitle)).toBeInTheDocument();
    expect(screen.getByText(nextItemTitle)).toBeInTheDocument();
  });

  test("renders empty state when no items are returned", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const emptyTitle = await screen.findByRole("heading", {
      name: /your feed is empty/i,
    });
    expect(emptyTitle).toBeInTheDocument();

    expect(screen.getByText(/subscribe to more feeds/i)).toBeInTheDocument();
  });

  test("renders category-specific empty state when categoryId is active", async () => {
    const mockCategories = [{ id: 10, name: "Tech" }];
    
    server.use(
      http.get("/api/feeds/items", () => {
        return HttpResponse.json([]);
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ success: true, data: mockCategories });
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
      {
        searchParams: { categoryId: "10" },
      },
    );

    const emptyTitle = await screen.findByRole("heading", {
      name: /tech has no items yet/i,
    });
    expect(emptyTitle).toBeInTheDocument();

    expect(
      screen.getByText(/assign feeds to this category/i),
    ).toBeInTheDocument();
    
    expect(
      screen.getByRole("button", { name: /assign feeds/i }),
    ).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    server.use(
      http.get("/api/feeds/items", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <TestWrapper>
        <FeedItemList />
      </TestWrapper>,
    );

    const errorTitle = await screen.findByRole("heading", {
      name: /something went wrong/i,
    });
    expect(errorTitle).toBeInTheDocument();

    expect(
      screen.getByText(/we couldn't load your feed items/i),
    ).toBeInTheDocument();
  });
});
